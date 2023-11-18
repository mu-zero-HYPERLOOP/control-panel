use std::collections::HashMap;
use std::sync::Arc;

use super::frame::Frame;
use super::parser::MessageParser;
use super::parser::error_frame_parser::ErrorFrameParser;
use super::parser::undefined_frame_parser::UndefinedFrameParser;
use tokio::sync::mpsc::Sender;
use tokio::sync::mpsc::Receiver;

use can_config_rs::config;

pub struct RxCom {
    parser_lookup : Arc<HashMap<(u32, bool), MessageParser>>,
    tx : Sender<Frame>,
    rx : Receiver<Frame>,
}

impl RxCom {
    pub fn create(network_config : &config::NetworkRef) -> Self {

        let (tx, rx) = tokio::sync::mpsc::channel(16);
        
        let mut parser_lookup = HashMap::new();
        for message_config in network_config.messages() {
            let key = match message_config.id() {
                config::MessageId::StandardId(id) => (*id, false),
                config::MessageId::ExtendedId(id) => (*id, true),
            };
            let parser = MessageParser::create_for_message(&message_config);
            parser_lookup.insert(key, parser);
        }

        Self {
            parser_lookup : Arc::new(parser_lookup),
            tx,
            rx,
        }
    }
    pub fn start(&mut self, can : &Arc<super::CAN>) {
        let can_receiver = Arc::new(CanReceiver::new(can, &self.parser_lookup, &self.tx));
        tokio::spawn(async move {
            can_receiver.start().await;
        });
    }
    
    pub fn get_rx_message_reciever(&mut self) -> &mut Receiver<Frame> {
        &mut self.rx
    }
}

pub struct CanReceiver {
    can : Arc<super::CAN>,
    parser_lookup : Arc<HashMap<(u32, bool), MessageParser>>,
    tx : Sender<Frame>,

}

impl CanReceiver {
    pub fn new(can : &Arc<super::CAN>, parser_lookup : &Arc<HashMap<(u32, bool),MessageParser>>, tx : &Sender<Frame>) -> Self {
        Self {
            can : can.clone(),
            parser_lookup : parser_lookup.clone(),
            tx : tx.clone(),
        }
    }
    async fn start(&self) {
        // concept 1 : construct some lookup based on the config
        let undefined_frame_parser = UndefinedFrameParser::new();
        let error_frame_parser = ErrorFrameParser::new();

        loop {
            let frame = self.can.receive().await;
            let frame = match frame {
                Ok(normal_frame) => {
                    // lookup parser
                    let key = (normal_frame.get_id(), normal_frame.get_ide_flag());
                    match self.parser_lookup.get(&key) {
                        Some(parser) => parser.parse(&normal_frame),
                        None => undefined_frame_parser.parse(&normal_frame),
                    }
                }
                Err(error_frame) => error_frame_parser.parse(&error_frame),
            };
            self.tx.send(frame).await.expect("failed to forward parsed frame");
            
            
        }
    }
}

