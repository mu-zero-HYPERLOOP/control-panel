use std::{
    collections::{HashMap, HashSet},
    sync::{atomic::AtomicUsize, Arc},
    time::{Duration, Instant},
};

use serde::{ser::SerializeMap, Serialize, Serializer};
use tauri::Manager;
use tokio::sync::{mpsc, Mutex};

use super::frame::{Frame, UniqueFrameKey};

type TraceStore = Arc<tokio::sync::Mutex<HashMap<UniqueFrameKey, TraceObjectEvent>>>;

pub struct TraceObject {
    observable: TraceObjectObservable,
    // saves last frame of each kind
    trace: TraceStore,
    start_time: Instant,
}

impl TraceObject {
    pub fn create(app_handle: &tauri::AppHandle) -> Self {
        Self {
            observable: TraceObjectObservable::new(app_handle, "trace", Duration::from_millis(500)),
            trace: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
            start_time: Instant::now(),
        }
    }

    pub async fn push_frame(&self, frame: Frame) {
        let key = frame.unique_key();
        let arrive_instant = Instant::now();
        let mut unlocked_trace = self.trace.lock().await;
        let prev = unlocked_trace.get_mut(&key);
        let timestamp = arrive_instant.duration_since(self.start_time.clone());
        match prev {
            Some(prev) => {
                let trace_object = TraceObjectEvent {
                    frame,
                    timestamp: TraceTimestamp { timestamp },
                    delta_time: TraceDeltaTime {
                        delta_time: timestamp.saturating_sub(prev.timestamp.timestamp),
                    },
                };
                *prev = trace_object.clone();
                trace_object
            }
            None => {
                let trace_object = TraceObjectEvent {
                    frame,
                    timestamp: TraceTimestamp { timestamp },
                    delta_time: TraceDeltaTime { delta_time: timestamp },
                };
                unlocked_trace.insert(key, trace_object.clone());
                trace_object
            }
        };
        drop(unlocked_trace);

        // instead of copying the trace_object we can store the key to update
        // the view later!
        self.observable.notify(key).await;
    }

    pub fn listen(&self) {
        self.observable.listen(&self.trace);
    }

    pub async fn get(&self) -> Vec<TraceObjectEvent> {
        let trace_state: Vec<TraceObjectEvent> = self
            .trace
            .lock()
            .await
            .iter()
            .map(|(_key, value)| value.clone())
            .collect();
        trace_state
    }

    pub async fn unlisten(&self) {
        self.observable.unlisten().await;
    }
}

#[derive(Clone)]
pub struct TraceObjectEvent {
    frame: Frame,
    timestamp: TraceTimestamp,
    delta_time: TraceDeltaTime,
}

#[derive(Clone)]
pub struct TraceTimestamp {
    timestamp: Duration,
}

#[derive(Clone)]
pub struct TraceDeltaTime {
    delta_time: Duration,
}

impl Serialize for TraceTimestamp {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut time_string = String::new();
        let secs = self.timestamp.as_secs();
        if secs > 0 {
            time_string.push_str(&secs.to_string());
            time_string.push_str("s ");
        }
        let millis = self.timestamp.subsec_millis();
        if millis > 0 {
            time_string.push_str(&millis.to_string());
            time_string.push_str("ms ");
        }
        let nanos = self.timestamp.subsec_micros() % 1000;
        if nanos > 0 {
            time_string.push_str(&nanos.to_string());
            time_string.push_str("\u{03bc}s");
        }
        time_string.serialize(serializer)
    }
}

impl Serialize for TraceDeltaTime {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut time_string = String::new();
        let secs = self.delta_time.as_secs();
        if secs > 0 {
            time_string.push_str(&secs.to_string());
            time_string.push_str("s ");
        }
        let millis = self.delta_time.subsec_millis();
        if millis > 0 {
            time_string.push_str(&millis.to_string());
            time_string.push_str("ms ");
        }
        let nanos = self.delta_time.subsec_micros() % 1000;
        if nanos > 0 {
            time_string.push_str(&nanos.to_string());
            time_string.push_str("\u{03bc}s");
        }
        time_string.serialize(serializer)
    }
}

impl Serialize for TraceObjectEvent {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut ser_map = serializer.serialize_map(Some(3))?;
        ser_map.serialize_entry("frame", &self.frame)?;
        ser_map.serialize_entry("timestamp", &(self.timestamp))?;
        ser_map.serialize_entry("delta_time", &(self.delta_time))?;

        ser_map.end()
    }
}

enum TraceObjectObservableMsg {
    Poison,
    Value(UniqueFrameKey),
}

struct TraceObjectObservable {
    event_name: String,
    listen_count: AtomicUsize,
    tx: mpsc::Sender<TraceObjectObservableMsg>,
    rx: Arc<Mutex<mpsc::Receiver<TraceObjectObservableMsg>>>,
    min_interval: tokio::time::Duration,
    app_handle: tauri::AppHandle,
}

impl TraceObjectObservable {
    pub fn new(
        app_handle: &tauri::AppHandle,
        event_name: &str,
        min_interval: tokio::time::Duration,
    ) -> Self {
        let (tx, rx) = mpsc::channel(10);
        Self {
            event_name: event_name.to_owned(),
            tx,
            rx: Arc::new(Mutex::new(rx)),
            listen_count: AtomicUsize::new(0),
            min_interval,
            app_handle: app_handle.clone(),
        }
    }

    pub async fn notify(&self, key: UniqueFrameKey) {
        if self.listen_count.load(std::sync::atomic::Ordering::SeqCst) != 0 {
            self.tx
                .send(TraceObjectObservableMsg::Value(key))
                .await
                .unwrap();
        }
    }

    pub fn listen(&self, store: &TraceStore) {
        let prev_count = self
            .listen_count
            .fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        if prev_count == 0 {
            // this indicates that the batching task should be started
            self.start_batching_task(store);
        }
    }

    pub async fn unlisten(&self) {
        let prev_count = self
            .listen_count
            .fetch_sub(1, std::sync::atomic::Ordering::SeqCst);
        if prev_count == 1 {
            // this indicates that the batching task should be stoped
            self.stop_batching_task().await;
        }
    }

    fn start_batching_task(&self, store: &TraceStore) {
        tokio::spawn(Self::notify_task(
            self.event_name.clone(),
            self.app_handle.clone(),
            self.min_interval.clone(),
            self.rx.clone(),
            store.clone(),
        ));
    }

    async fn stop_batching_task(&self) {
        self.tx
            .send(TraceObjectObservableMsg::Poison)
            .await
            .unwrap();
    }

    async fn notify_task(
        event_name: String,
        app_handle: tauri::AppHandle,
        min_interval: tokio::time::Duration,
        rx: Arc<tokio::sync::Mutex<mpsc::Receiver<TraceObjectObservableMsg>>>,
        store: TraceStore,
    ) {
        println!("start notify task for {event_name}");
        let mut rx = rx.lock().await;
        let mut next_batch_time = tokio::time::Instant::now();
        let mut timeout = tokio::time::Instant::now() + Duration::from_secs(0xFFFF);
        let mut batch: HashSet<UniqueFrameKey> = HashSet::new();
        loop {
            match tokio::time::timeout_at(timeout, rx.recv()).await {
                Ok(opt) => {
                    match opt {
                        Some(TraceObjectObservableMsg::Poison) => {
                            if !batch.is_empty() {
                                let store_lock = store.lock().await;
                                let payload: Vec<TraceObjectEvent> =
                                    batch.iter().map(|key| store_lock[key].clone()).collect();
                                app_handle
                                    .emit_all(&event_name, payload)
                                    .expect("failed to emit trace event");
                            }
                            break;
                        }
                        Some(TraceObjectObservableMsg::Value(key)) => {
                            batch.insert(key);
                            // only send batch if the last interval is min_interval in the past!

                            if next_batch_time <= tokio::time::Instant::now() {
                                // println!("emit {event_name} = {value:?}");
                                let store_lock = store.lock().await;
                                // FIXME consider using get instead of index [] for hashmaps to
                                // avoid task crashes!!
                                let payload: Vec<TraceObjectEvent> =
                                    batch.iter().map(|key| store_lock[key].clone()).collect();
                                app_handle
                                    .emit_all(&event_name, payload)
                                    .expect("failed to emit trace event");
                                batch.clear();
                                next_batch_time = tokio::time::Instant::now() + min_interval;
                                timeout = next_batch_time; //copy!
                            }
                        }
                        None => {
                            panic!("rx_receiver closed early");
                        }
                    };
                }
                Err(_elapsed) => {
                    if !batch.is_empty() {
                        let store_lock = store.lock().await;
                        let payload: Vec<TraceObjectEvent> =
                            batch.iter().map(|key| store_lock[key].clone()).collect();
                        batch.clear();
                        app_handle
                            .emit_all(&event_name, payload)
                            .expect("failed to emit trace event");
                        next_batch_time = tokio::time::Instant::now() + min_interval;
                    }
                    timeout += Duration::from_secs(0xFFFF); //wait for ever!
                }
            }
        }
        println!("stop notify task for {event_name}");
    }
}
