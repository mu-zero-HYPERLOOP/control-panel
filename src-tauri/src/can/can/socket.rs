use std::mem;

use libc::{c_int, c_void, can_frame, read, sa_family_t, sockaddr_can, write};

pub use libc::{
    AF_CAN, CANFD_MTU, CAN_EFF_FLAG, CAN_EFF_MASK, CAN_ERR_FLAG, CAN_MTU, CAN_RAW,
    CAN_RAW_ERR_FILTER, CAN_RAW_FD_FRAMES, CAN_RAW_FILTER, CAN_RAW_JOIN_FILTERS, CAN_RAW_LOOPBACK,
    CAN_RAW_RECV_OWN_MSGS, CAN_RTR_FLAG, CAN_SFF_MASK, PF_CAN, SOCK_RAW, SOL_CAN_BASE, SOL_CAN_RAW,
};

use crate::can::can_frame::{CanError, CanFrame};


#[derive(Clone)]
struct CanSocket {
    fd: c_int,
}

impl CanSocket {
    fn open(ifname: &str) -> Result<CanSocket, std::io::Error> {
        let ifindex = nix::net::if_::if_nametoindex(ifname)?;
        let mut addr: sockaddr_can = unsafe { mem::zeroed() };
        addr.can_family = AF_CAN as sa_family_t;
        addr.can_ifindex = ifindex as c_int;
        let addr: *const sockaddr_can = &addr;

        let fd = unsafe { libc::socket(PF_CAN, SOCK_RAW, CAN_RAW) };

        if fd == -1 {
            return Err(std::io::Error::last_os_error());
        }

        let ret = unsafe { libc::bind(fd, addr.cast(), mem::size_of::<sockaddr_can>() as u32) };

        if ret == -1 {
            let err = std::io::Error::last_os_error();
            unsafe { libc::close(fd) };
            Err(err)
        } else {
            Ok(CanSocket { fd })
        }
    }
    fn close(&mut self) {
        unsafe {
            libc::close(self.fd);
        }
    }
    fn receive(&self) -> Result<CanFrame, CanError> {
        let mut frame: can_frame = unsafe { mem::zeroed() };
        let n = mem::size_of::<can_frame>();

        let rd = unsafe { read(self.fd, &mut frame as *mut _ as *mut c_void, n) };

        if rd as usize == n {
            // parse can_frame into CanFrame
            if frame.can_id & CAN_ERR_FLAG != 0 {
                return Err(CanError::Can(u64::from_be_bytes(frame.data)));
            } else {
                Ok(CanFrame::from_raw(frame))
            }
        } else {
            Err(CanError::Io(std::io::Error::last_os_error()))
        }
    }

    fn transmit(&self, frame: &CanFrame) -> Result<(), CanError> {
        let fd = self.fd;
        let canframe = frame.to_raw();

        let ret = unsafe {
            write(
                fd,
                (&canframe as *const can_frame).cast(),
                mem::size_of::<can_frame>(),
            )
        };

        if ret as usize == mem::size_of::<can_frame>() {
            Ok(())
        } else {
            Err(CanError::Io(std::io::Error::last_os_error()))
        }
    }
}

pub struct OwnedCanSocket {
    socket: CanSocket,
}

pub struct CanSocketRef {
    socket : CanSocket,
}

impl OwnedCanSocket {
    pub fn open(ifname: &str) -> Result<Self, std::io::Error> {


        Ok(OwnedCanSocket {
            socket: CanSocket::open(ifname)?,
        })
    }
    
    pub fn as_ref(&self) -> CanSocketRef {
        CanSocketRef {
            socket : self.socket.clone()
        }
    }

    pub fn receive(&self) -> Result<CanFrame, CanError> {
        self.socket.receive()
    }

    pub fn transmit(&self, frame: &CanFrame) -> Result<(), CanError> {
        self.socket.transmit(frame)
    }
}

impl CanSocketRef {
    pub fn receive(&self) -> Result<CanFrame, CanError> {
        self.socket.receive()
    }

    pub fn transmit(&self, frame: &CanFrame) -> Result<(), CanError> {
        self.socket.transmit(frame)
    }
}


impl Drop for OwnedCanSocket {
    fn drop(&mut self) {
        self.socket.close();
    }
}
