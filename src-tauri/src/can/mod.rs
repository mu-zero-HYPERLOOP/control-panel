
#[cfg(feature="socket-can")]
mod can;

#[cfg(feature="mock-can")]
mod mock_can;

mod rx;
pub mod frame;
pub mod parser;
mod can_frame;


use std::sync::Arc;

use self::{rx::RxCom, frame::Frame};

use can_config_rs::config;
use tokio::sync::mpsc::Receiver;

#[cfg(feature="socket-can")]
pub type CAN = can::CAN;

#[cfg(feature="mock-can")]
pub type CAN = mock_can::MockCan;

// CaNetwork Layer
pub struct CNL {
    can0 : Arc<CAN>,
    can1 : Arc<CAN>,
    rx : RxCom,
}

impl CNL {
    pub fn create(network_config : &config::NetworkRef) -> Self {
#[cfg(feature="socket-can")]
        let can0 = Arc::new(can::CAN::create(can::CanModule::CAN0, true).expect("failed to setup can0"));
#[cfg(feature="socket-can")]
        let can1 = Arc::new(can::CAN::create(can::CanModule::CAN1, true).expect("failed to setup can1"));
#[cfg(feature="mock-can")]
        let can0 = Arc::new(mock_can::MockCan::create(network_config));
#[cfg(feature="mock-can")]
        let can1 = Arc::new(mock_can::MockCan::create(network_config));

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
