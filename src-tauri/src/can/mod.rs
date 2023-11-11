use std::sync::Arc;

use self::{rx::RxCom, frame::Frame};

use can_config_rs::config;
use tokio::sync::mpsc::Receiver;

mod can;
mod rx;
pub mod frame;
pub mod parser;


// CaNetwork Layer
pub struct CNL {
    can0 : Arc<can::CAN>,
    can1 : Arc<can::CAN>,
    rx : RxCom,
}

impl CNL {
    pub fn create(network_config : &config::NetworkRef) -> Self {
        let can0 = Arc::new(can::CAN::create(can::CanModule::CAN0, true).expect("failed to setup can0"));
        let can1 = Arc::new(can::CAN::create(can::CanModule::CAN1, true).expect("failed to setup can1"));

        let rx = RxCom::create(network_config);
        Self {
            can0,
            can1,
            rx
        }
    }
    pub fn start(&mut self) {
        self.rx.start(&self.can0);
        self.rx.start(&self.can1);
    }

    pub fn get_rx_message_receiver(&mut self) -> &mut Receiver<Frame> {
        self.rx.get_rx_message_reciever()
    }

    
}
