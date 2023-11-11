use serde::Serialize;

use crate::can::frame::{Frame, signal_frame::{SignalFrame, Signal}, type_frame::TypeFrame, undefined_frame::UndefinedFrame, error_frame::ErrorFrame};



#[derive(Clone, Serialize)]
#[allow(dead_code)]
pub enum SerializedFrame{
    SignalFrame(SerializedSignalFrame),
    TypeFrame(SerializedTypeFrame),
    UndefinedFrame(SerializedUndefinedFrame),
    ErrorFrame(SerializedErrorFrame),
}


impl From<Frame> for SerializedFrame {
    fn from(value: Frame) -> Self {
        match value {
            Frame::SignalFrame(signal_frame) => Self::SignalFrame(SerializedSignalFrame::from(signal_frame)),
            Frame::TypeFrame(type_frame) => Self::TypeFrame(SerializedTypeFrame::from(type_frame)),
            Frame::UndefinedFrame(undefined_frame) => Self::UndefinedFrame(SerializedUndefinedFrame(undefined_frame)),
            Frame::ErrorFrame(error_frame) => Self::ErrorFrame(SerializedErrorFrame(error_frame)),
        }
    }
}


#[derive(Clone, Serialize)]
#[allow(dead_code)]
pub struct SerializedSignalFrame {
    id : u32,
    ide : bool,
    rtr : bool,
    dlc : u8,
    signals : Vec<SerializedSignal>,
}
impl From<SignalFrame> for SerializedSignalFrame {
    fn from(value: SignalFrame) -> Self {
        Self {
            id : value.id(),
            ide : value.ide(),
            rtr : value.rtr(),
            dlc : value.dlc(),
            signals : value.into_signals().into_iter().map(|signal| SerializedSignal::from(signal)).collect()
        }
    }
}

#[derive(Clone, Serialize)]
#[allow(dead_code)]
pub struct SerializedSignal {
    name : String,
    value : String,
}
impl From<Signal> for SerializedSignal {
    fn from(value: Signal) -> Self {
        Self{
            name : value.name().to_owned(),
            value : match value.value(){
                crate::can::frame::signal_frame::SignalValue::Unsigned(v) => format!("{v}"),
                crate::can::frame::signal_frame::SignalValue::Signed(v) => format!("{v}"),
                crate::can::frame::signal_frame::SignalValue::Real(v) => format!("{v}"),
            }
        }
    }
}


#[derive(Clone, Serialize)]
#[allow(dead_code)]
pub struct SerializedTypeFrame {
    //TODO 
}
impl From<TypeFrame> for SerializedTypeFrame {
    fn from(value: TypeFrame) -> Self {
        todo!()
    }
}

#[derive(Clone, Serialize)]
pub struct SerializedUndefinedFrame(UndefinedFrame);
impl From<UndefinedFrame> for SerializedUndefinedFrame {
    fn from(value: UndefinedFrame) -> Self {
        SerializedUndefinedFrame(value)
    }
}

#[derive(Clone, Serialize)]
pub struct SerializedErrorFrame(ErrorFrame);
impl From<ErrorFrame> for SerializedErrorFrame {
    fn from(value : ErrorFrame) -> Self {
        SerializedErrorFrame(value)
    }
}
