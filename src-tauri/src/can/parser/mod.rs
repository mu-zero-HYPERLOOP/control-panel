
use can_config_rs::config;

use super::can_frame::CanError;
use super::{can_frame::CanFrame, frame::Frame};
use super::parser::signal_frame_parser::SignalFrameParser;
use super::parser::error_frame_parser::ErrorFrameParser;
use super::parser::type_frame_parser::TypeFrameParser;
use super::parser::undefined_frame_parser::UndefinedFrameParser;


pub mod error_frame_parser;
pub mod signal_frame_parser;
pub mod type_frame_parser;
pub mod undefined_frame_parser;


pub enum MessageParser {
    SignalFrameParser(SignalFrameParser),
    TypeFrameParser(TypeFrameParser),
    UndefinedFrameParser(UndefinedFrameParser),
    ErrorFrameParser(ErrorFrameParser),
}

impl MessageParser {
    pub fn parse(&self, frame : &CanFrame) -> Frame{
        match &self {
            MessageParser::SignalFrameParser(signal_handler) => signal_handler.parse(frame),
            MessageParser::TypeFrameParser(type_handler) => type_handler.parse(frame),
            MessageParser::UndefinedFrameParser(undefined_handler) => undefined_handler.parse(frame),
            MessageParser::ErrorFrameParser(error_handler) => panic!(),
        }
    }

    pub fn parse_error(&self, frame : &CanError) -> Frame{
        match &self {
            MessageParser::SignalFrameParser(signal_handler) => panic!(),
            MessageParser::TypeFrameParser(type_handler) => panic!(),
            MessageParser::UndefinedFrameParser(undefined_handler) => panic!(),
            MessageParser::ErrorFrameParser(error_handler) => error_handler.parse(frame),
        }
    }

    pub fn create_for_message(message_config : &config::MessageRef) -> MessageParser {
        match &message_config.encoding() {
            Some(_) => MessageParser::TypeFrameParser(TypeFrameParser::new(message_config)),
            None => MessageParser::SignalFrameParser(SignalFrameParser::new(message_config)),
        }
    }
    pub fn create_for_undefined() -> MessageParser {
        MessageParser::UndefinedFrameParser(UndefinedFrameParser::new())
    }
    pub fn create_for_error() -> MessageParser {
        MessageParser::ErrorFrameParser(ErrorFrameParser::new())
    }
}
