use crate::cnl::{errors::Result,can_frame::CanFrame, frame::Frame, parser::type_frame_parser::TypeFrameParser, timestamped::Timestamped};

pub struct CommandRespFrameHandler {
    parser: TypeFrameParser,
}

impl CommandRespFrameHandler {
    #[allow(unused)]
    pub fn create(parser: TypeFrameParser) -> Self {
        Self { parser }
    }
    pub async fn handle(&self, can_frame: &Timestamped<CanFrame>) -> Result<Timestamped<Frame>> {
        let frame = self.parser.parse(can_frame)?;
        let Frame::TypeFrame(_type_frame) = &frame else {
            return Err(crate::cnl::errors::Error::InvalidCommandMessageFormat);
        };

        Ok(Timestamped::new(can_frame.timestamp().clone(), frame))
    }
}
