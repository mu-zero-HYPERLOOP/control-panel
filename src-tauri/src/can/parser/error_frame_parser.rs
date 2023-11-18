use crate::can::{frame::Frame, can_frame::CanError};


#[derive(Clone)]
pub struct ErrorFrameParser;

impl ErrorFrameParser {
    pub fn new() -> Self {
        Self {
        }
    }

    pub fn parse(&self, frame : &CanError) -> Frame{
        // TODO construct error frame and return it.
        todo!()
    }
}
