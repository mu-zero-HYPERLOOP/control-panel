use can_config_rs::config;

use crate::can::{
    can_frame::CanFrame,
    frame::{
        signal_frame::{Signal, SignalFrame, SignalValue},
        Frame,
    },
};

enum SignalParser {
    UnsignedSignalParser {
        signal_ref: config::SignalRef,
        byte_offset: u32,
        byte_size: u32,
    },
    SignedSignalParser {
        signal_ref: config::SignalRef,
        byte_offset: u32,
        byte_size: u32,
    },
    DecimalSignalParser {
        signal_ref: config::SignalRef,
        byte_offset: u32,
        byte_size: u32,
        offset: f64,
        scale: f64,
    },
}

impl SignalParser {
    pub fn parse(&self, data: u64) -> Signal {
        match &self {
            SignalParser::UnsignedSignalParser {
                signal_ref,
                byte_offset,
                byte_size,
            } => {
                let value = data
                    .overflowing_shr(64 - byte_offset - byte_size)
                    .0 & 
                    (0xFFFFFFFFFFFFFFFF as u64).overflowing_shr(64 - byte_size)
                    .0;

                Signal::new(signal_ref.clone(), SignalValue::Unsigned(value))
            }
            SignalParser::SignedSignalParser {
                signal_ref,
                byte_offset,
                byte_size,
            } => {
                let value = data
                    .overflowing_shr(64 - byte_offset - byte_size)
                    .0 & 
                    (0xFFFFFFFFFFFFFFFF as u64).overflowing_shr(64 - byte_size)
                    .0;

                let ivalue = unsafe { std::mem::transmute::<u64, i64>(value) };

                Signal::new(signal_ref.clone(), SignalValue::Signed(ivalue))
            }
            SignalParser::DecimalSignalParser {
                signal_ref,
                byte_offset,
                byte_size,
                offset,
                scale,
            } => {
                let value = data
                    .overflowing_shr(64 - byte_offset - byte_size)
                    .0 & 
                    (0xFFFFFFFFFFFFFFFF as u64).overflowing_shr(64 - byte_size)
                    .0;
                let dvalue = value as f64 * scale - offset;

                Signal::new(signal_ref.clone(), SignalValue::Real(dvalue))
            }
        }
    }
}

pub struct SignalFrameParser {
    message_ref: config::MessageRef,
    signal_parsers: Vec<SignalParser>,
}

impl SignalFrameParser {
    pub fn new(message_ref: &config::MessageRef) -> Self {
        Self {
            message_ref: message_ref.clone(),
            signal_parsers: message_ref
                .signals()
                .iter()
                .map(|signal| match signal.ty() {
                    config::SignalType::UnsignedInt { size } => {
                        SignalParser::UnsignedSignalParser {
                            signal_ref: signal.clone(),
                            byte_offset: signal.byte_offset() as u32,
                            byte_size: *size as u32,
                        }
                    }
                    config::SignalType::SignedInt { size } => SignalParser::SignedSignalParser {
                        signal_ref: signal.clone(),
                        byte_offset: signal.byte_offset() as u32,
                        byte_size: *size as u32,
                    },
                    config::SignalType::Decimal {
                        size,
                        offset,
                        scale,
                    } => SignalParser::DecimalSignalParser {
                        signal_ref: signal.clone(),
                        byte_offset: signal.byte_offset() as u32,
                        byte_size: *size as u32,
                        offset: *offset,
                        scale: *scale,
                    },
                })
                .collect(),
        }
    }
    pub fn parse(&self, frame: &CanFrame) -> Frame {
        let data = frame.get_data_u64();
        Frame::SignalFrame(SignalFrame::new(
            frame.get_id(),
            frame.get_ide_flag(),
            frame.get_rtr_flag(),
            frame.get_dlc(),
            self.signal_parsers
                .iter()
                .map(|parser| parser.parse(data))
                .collect(),
            self.message_ref.clone(), // performance hit because of atomic op
        ))
    }
}
