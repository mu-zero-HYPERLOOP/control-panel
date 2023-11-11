
use serde::Serialize;

use crate::can::frame::type_frame::TypeFrame;
use crate::can::frame::signal_frame::SignalFrame;
use crate::can::frame::undefined_frame::UndefinedFrame;
use crate::can::frame::error_frame::ErrorFrame;

pub mod error_frame;
pub mod signal_frame;
pub mod type_frame;
pub mod undefined_frame;


pub enum Frame {
    SignalFrame(SignalFrame),
    TypeFrame(TypeFrame),
    UndefinedFrame(UndefinedFrame),
    ErrorFrame(ErrorFrame),
}
