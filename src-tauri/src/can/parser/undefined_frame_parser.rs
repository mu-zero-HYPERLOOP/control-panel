use crate::can::{
    can_frame::CanFrame,
    frame::{undefined_frame::UndefinedFrame, Frame},
};

#[derive(Clone)]
pub struct UndefinedFrameParser;

impl UndefinedFrameParser {
    pub fn new() -> Self {
        Self {}
    }

    pub fn parse(&self, frame: &CanFrame) -> Frame {
        Frame::UndefinedFrame(UndefinedFrame::new(
            frame.get_id(),
            frame.get_ide_flag(),
            frame.get_rtr_flag(),
            frame.get_dlc(),
            frame.get_data_u64(),
        ))
    }
}
