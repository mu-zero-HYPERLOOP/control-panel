use std::{sync::Mutex, time::Duration};

use can_config_rs::config;
use rand::{rngs::ThreadRng, Rng};

use super::can_frame::{CanFrame, CanError};





pub struct MockCan {
    network_ref : config::NetworkRef,
    rng : Mutex<ThreadRng>,
}

impl MockCan {
    pub fn create(network_ref : &config::NetworkRef) -> Self {
        Self {
            network_ref : network_ref.clone(),
            rng : Mutex::new(rand::thread_rng()),
        }
    }

    pub async fn send(&self, frame: CanFrame) {
        println!("mock-can : sending {frame:?}");
    }

    pub async fn receive(&self) -> Result<CanFrame, CanError> {
        // await for random amount of time.
        let timeout : u64 = self.rng.lock().expect("failed to acquire mock can lock").gen_range(0..50);
        tokio::time::sleep(Duration::from_millis(timeout)).await;
        
        let message_index = self.rng.lock().expect("failed to acquire mock can lock").gen_range(0..self.network_ref.messages().len());
        let message_ref = &self.network_ref.messages()[message_index];
        

        // signal frame.
        let (id, ide) = match message_ref.id() {
            config::MessageId::StandardId(id) => (*id, false),
            config::MessageId::ExtendedId(id) => (*id, true),
        };
        let mut dlc = 0;
        let data = self.rng.lock().expect("failed to acquire mock can lock").gen();
        for signal in message_ref.signals() {
            dlc += signal.size();
        }

        Ok(CanFrame::new(
            id,
            ide,
            false,
            dlc,
            data,
        ))
    }
    pub async fn receive_err(&mut self) -> CanError {
        // await for random amount of time.
        let timeout : u64 = self.rng.lock().expect("failed to acquire mock can lock").gen_range(2..10);
        tokio::time::sleep(Duration::from_secs(timeout)).await;
        
        return CanError::Can(42);
    }
}

unsafe impl Send for MockCan {}
unsafe impl Sync for MockCan {}
