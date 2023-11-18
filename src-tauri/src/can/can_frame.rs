
#[cfg(feature="socket-can")]
use libc::can_frame;

#[cfg(feature="socket-can")]
use libc::{CAN_EFF_FLAG, CAN_EFF_MASK, CAN_RTR_FLAG, CAN_SFF_MASK};

#[derive(Debug)]
pub enum CanError {
    Io(std::io::Error),
    Disconnect(String),
    Can(u64),
}

#[derive(Debug)]
pub struct CanFrame {
    id: u32,
    ide: bool,
    rtr: bool,
    dlc: u8,
    data: u64,
}

unsafe impl Send for CanFrame {}
unsafe impl Sync for CanFrame {}
unsafe impl Send for CanError {}
unsafe impl Sync for CanError {}

impl CanFrame {
    pub fn new(id: u32, ide: bool, rtr: bool, dlc: u8, data : u64) -> Self {
        Self {
            id,
            ide,
            rtr,
            dlc,
            data,
        }
    }

    pub fn new_remote(id: u32, dlc: u8) -> Self {
        let ide = if id <= 4087 { false } else { true };
        Self {
            id,
            ide,
            rtr: true,
            dlc,
            data: 0,
        }
    }
    pub fn new_ext_frame(id: u32, rtr: bool, dlc: u8) -> Self {
        Self {
            id,
            ide: true,
            rtr,
            dlc,
            data: 0,
        }
    }

    #[cfg(feature="socket-can")]
    pub fn from_raw(frame: can_frame) -> Self {
        let ide = frame.can_id & CAN_EFF_FLAG != 0;
        let id = if ide {
            frame.can_id & CAN_EFF_MASK
        } else {
            frame.can_id & CAN_SFF_MASK
        };
        Self {
            id,
            rtr: frame.can_id & CAN_RTR_FLAG != 0,
            ide,
            dlc: frame.can_dlc,
            data: u64::from_be_bytes(frame.data),
        }
    }

    #[cfg(feature="socket-can")]
    pub fn to_raw(&self) -> can_frame {
        let mut canframe : can_frame= unsafe {std::mem::zeroed()};
        if self.ide {
            canframe.can_id |= CAN_EFF_FLAG;
            canframe.can_id |= self.id & CAN_SFF_MASK;
        }else{ 
            canframe.can_id |= self.id & CAN_EFF_MASK;
        }
        if self.rtr {
            canframe.can_id |= CAN_RTR_FLAG;
        }
        canframe.can_dlc = self.dlc;
        canframe.data = unsafe {std::mem::transmute::<u64,[u8;8]>(self.data)};
        canframe
    }

    pub fn get_id(&self) -> u32 {
        self.id
    }
    pub fn set_id(&mut self, id: u32) {
        self.id = id;
    }
    pub fn set_ext_id(&mut self, id: u32) {
        self.id = id;
        self.ide = true;
    }
    pub fn get_ide_flag(&self) -> bool {
        self.ide
    }
    pub fn set_ide_flag(&mut self, ide: bool) {
        self.ide = ide;
    }
    pub fn get_rtr_flag(&self) -> bool {
        self.rtr
    }
    pub fn set_rtr_flag(&mut self, rtr: bool) {
        self.rtr = rtr
    }
    pub fn get_dlc(&self) -> u8 {
        self.dlc
    }
    pub fn set_dlc(&mut self, dlc: u8) {
        self.dlc = dlc;
    }
    pub fn get_data_u64(&self) -> u64 {
        self.data
    }
    pub fn get_data_8u8(&self) -> [u8; 8] {
        unsafe { std::mem::transmute::<u64, [u8; 8]>(self.data) }
    }
    pub fn set_data_u64(&mut self, data: u64) {
        self.data = data;
    }
    pub fn set_data_8u8(&mut self, data: [u8; 8]) {
        self.data = u64::from_be_bytes(data);
    }
}
