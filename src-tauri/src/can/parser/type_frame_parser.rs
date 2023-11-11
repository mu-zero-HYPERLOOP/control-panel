use can_config_rs::config;

use crate::can::{can::frame::CanFrame, frame::{Frame, type_frame::{TypeFrame, TypeValue}}};


enum TypeParser {
    UnsignedParser{},
    SignedParser{},
    DecimalParser{},
    CompositeParser{},
    EnumParser{},
    ArrayParser{},
}

impl TypeParser {
    pub fn parse(&self, data : u64) -> TypeValue{
        match &self {
            TypeParser::UnsignedParser {  } => todo!(),
            TypeParser::SignedParser {  } => todo!(),
            TypeParser::DecimalParser {  } => todo!(),
            TypeParser::CompositeParser {  } => todo!(),
            TypeParser::EnumParser {  } => todo!(),
            TypeParser::ArrayParser {  } => todo!(),
        }
    }
}

pub struct TypeFrameParser {
    message_ref: config::MessageRef,
    root_parser : TypeParser,
}

impl TypeFrameParser {
    pub fn new(message_ref: &config::MessageRef) -> Self {
        Self {
            message_ref: message_ref.clone(),
            root_parser : TypeParser::CompositeParser{
            }
        }
    }

    pub fn parse(&self, frame: &CanFrame) -> Frame {
        let TypeValue::Composite(composite_type_value) = self.root_parser.parse(frame.get_data_u64()) else {
            panic!("root parser is not a CompositeParser");
        };
        Frame::TypeFrame(TypeFrame::new(
            frame.get_id(),
            frame.get_ide_flag(),
            frame.get_rtr_flag(),
            frame.get_dlc(),
            composite_type_value,
            self.message_ref.clone(),
        ))
    }
}
