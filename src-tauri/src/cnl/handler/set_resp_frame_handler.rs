use crate::cnl::{errors::{Result, Error}, can_frame::CanFrame, frame::Frame, parser::type_frame_parser::TypeFrameParser, timestamped::Timestamped};

pub struct SetRespFrameHandler {
    parser: TypeFrameParser,
}

impl SetRespFrameHandler {
    pub fn create(parser: TypeFrameParser) -> Self {
        Self { parser }
    }
    pub async fn handle(&self, can_frame: &Timestamped<CanFrame>) -> Result<Timestamped<Frame>> {
        let frame = self.parser.parse(can_frame)?;
        let Frame::TypeFrame(_type_frame) = &frame else {
            return Err(Error::InvalidSetResponseFormat);
        };
        Ok(Timestamped::new(can_frame.timestamp().clone(),frame))
    }
}
