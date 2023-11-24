use std::{collections::HashMap, time::{Instant, Duration}};

use serde::{Serialize, ser::SerializeMap};

use crate::observers::observable_data::ObservableData;

use super::frame::{Frame, UniqueFrameKey};

pub struct TraceObject {
    observable: ObservableData<TraceObjectEvent>,
        // saves last frame of each kind
    trace: tokio::sync::Mutex<HashMap<UniqueFrameKey, TraceObjectEvent>>,
    start_time: Instant,
}

impl TraceObject {
    pub fn create(app_handle: &tauri::AppHandle) -> Self {
        Self {
            observable: ObservableData::create(
                app_handle,
                "trace",
                tokio::time::Duration::from_millis(200),
                2048,
            ),
            trace: tokio::sync::Mutex::new(HashMap::new()),
            start_time: Instant::now(),
        }
    }

    pub async fn push_frame(&self, frame: Frame) {
        // TODO Issue #7 
        // We should calculate a timestamp here and forward it correctly to the view
        let key = frame.unique_key();
        let arrive_instant = Instant::now();
        let mut unlocked_trace = self
            .trace
            .lock()
            .await;
        let prev = unlocked_trace.get_mut(&key);
        let timestamp = arrive_instant.duration_since(self.start_time.clone());
        let trace_object = match prev {
            Some(prev)  => {
                let trace_object = TraceObjectEvent { 
                    frame, 
                    timestamp, 
                    delta_time: timestamp - prev.timestamp,
                };
                *prev = trace_object.clone();
                trace_object
            },
            None => {
                let trace_object = TraceObjectEvent { 
                    frame, 
                    timestamp, 
                    delta_time: timestamp,
                };
                unlocked_trace.insert(key, trace_object.clone());
                trace_object
            },
        };
        drop(unlocked_trace);
        self.observable.notify(trace_object).await;
    }

    pub fn listen(&self) {
        self.observable.listen();
    }

    pub async fn get(&self) -> Vec<TraceObjectEvent> {
        let trace_state : Vec<TraceObjectEvent> = self.trace
                .lock()
                .await
                .iter()
                .map(|(_key, value)| 
                    value.clone()
                )
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
    timestamp: Duration,     // time since start serialized as milli seconds
    delta_time: Duration    // time since last frame serialized as micro-seconds
}

impl Serialize for TraceObjectEvent {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: serde::Serializer,
        {
            let mut ser_map = serializer.serialize_map(Some(3))?;
            ser_map.serialize_entry("frame", &self.frame)?;
            ser_map.serialize_entry("timestamp" , 
                                    &(self.timestamp.as_millis() % u64::MAX as u128))?;
        ser_map.serialize_entry("delta_time" , 
                                &(self.delta_time.as_micros() % u64::MAX as u128))?;

        ser_map.end()
    }
}
