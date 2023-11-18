
use tokio::{sync::{mpsc::Receiver, Mutex}, sync::mpsc::Sender, runtime::Handle};

use self::{
    socket::OwnedCanSocket,
};

use super::can_frame::{CanFrame, CanError};

mod socket;

pub enum CanModule {
    CAN0,
    CAN1,
}

pub struct CAN {
    socket: OwnedCanSocket,
    rx: Mutex<Receiver<CanFrame>>,
    err_rx: Mutex<Receiver<CanError>>,
    tx : Sender<CanFrame>,
}

impl CAN {
    pub fn create(module: CanModule, recv_errors: bool) -> Result<CAN, std::io::Error> {
        let ifname = match module {
            CanModule::CAN0 => "can0",
            CanModule::CAN1 => "can1",
        };
        let socket = OwnedCanSocket::open(ifname)?;

        let (tx, rx) = tokio::sync::mpsc::channel::<CanFrame>(16);
        let (err_tx, err_rx) = tokio::sync::mpsc::channel::<CanError>(16);

        let (txtx, mut txrx) = tokio::sync::mpsc::channel::<CanFrame>(16);

        let socket_ref = socket.as_ref();
        tokio::task::spawn_blocking(move|| loop {
            let frame = socket_ref.receive();
            Handle::current().block_on(async {
                match frame {
                    Ok(frame) => {
                        tx.send(frame).await.expect("failed to forward canframe receiver closed early");
                    }
                    Err(err) => {
                        err_tx.send(err).await.expect("failed to forward canerror receiver closed early");
                    }
                }
            });
        });

        let socket_ref = socket.as_ref();
        tokio::task::spawn_blocking(move|| loop {
            let frame = Handle::current().block_on(async {
                txrx.recv().await.expect("failed to transmit canframe sender closed early")
            });
            socket_ref.transmit(&frame).expect("failed to write to socket");
        });

        Ok(CAN { tx : txtx, socket, rx : Mutex::new(rx), err_rx : Mutex::new(err_rx) })
    }

    pub async fn send(&self, frame: CanFrame) {
        self.tx.send(frame).await.expect("failed to forward canframe to can module for transmission");
    }

    pub async fn receive(&self) -> Result<CanFrame, CanError> {
        let frame = self.rx.lock().await
            .recv().await;
        match frame {
            Some(frame) => Ok(frame),
            None => Err(CanError::Disconnect(format!("can receive thread closed rx channel")))
        }
    }

    pub async fn receive_err(&mut self) -> CanError {
        let error = self.err_rx.lock().await.recv().await;
        match error {
            Some(error) => error,
            None => CanError::Disconnect(format!("can receive thread closed rx channel")),
        }
    }
}
unsafe impl Send for CAN {}
unsafe impl Sync for CAN {}
