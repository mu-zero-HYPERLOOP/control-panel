use crate::cnl::can_adapter::CanAdapterInterface;
use can_config_rs::config::bus::BusRef;
use tauri::plugin::Plugin;
use tokio::{
    runtime::Handle,
    sync::mpsc::Sender,
    sync::{mpsc::Receiver, Mutex},
};

use self::socket::OwnedCanSocket;

use super::{timestamped::Timestamped, can_frame::CanFrame, can_error::CanError, TCanError, TCanFrame};

mod socket;

pub struct SocketCanAdapter {
    socket: OwnedCanSocket,
    rx: Mutex<Receiver<Timestamped<CanFrame>>>,
    err_rx: Mutex<Receiver<Timestamped<CanError>>>,
    tx: Sender<CanFrame>,
}

impl SocketCanAdapter {
    pub fn create(bus : &BusRef) -> Result<SocketCanAdapter, std::io::Error> {
        let ifname = bus.name();
        let socket = OwnedCanSocket::open(ifname)?;

        let (tx, rx) = tokio::sync::mpsc::channel::<TCanFrame>(16);
        let (err_tx, err_rx) = tokio::sync::mpsc::channel::<TCanError>(16);

        let (txtx, mut txrx) = tokio::sync::mpsc::channel::<CanFrame>(16);

        let socket_ref = socket.as_ref();
        tokio::task::spawn_blocking(move || loop {
            let frame = socket_ref.receive();
            Handle::current().block_on(async {
                match frame {
                    Ok(frame) => {
                        tx.send(Timestamped::now(frame))
                            .await
                            .expect("failed to forward canframe receiver closed early");
                    }
                    Err(err) => {
                        err_tx
                            .send(Timestamped::now(err))
                            .await
                            .expect("failed to forward canerror receiver closed early");
                    }
                }
            });
        });

        let socket_ref = socket.as_ref();
        tokio::task::spawn_blocking(move || loop {
            let frame = Handle::current().block_on(async {
                txrx.recv()
                    .await
                    .expect("failed to transmit canframe sender closed early")
            });
            socket_ref
                .transmit(&frame)
                .expect("failed to write to socket");
        });

        Ok(SocketCanAdapter {
            tx: txtx,
            socket,
            rx: Mutex::new(rx),
            err_rx: Mutex::new(err_rx),
        })
    }

}


impl CanAdapterInterface for SocketCanAdapter {

    async fn send(&self, frame: CanFrame) {
        self.tx
            .send(frame)
            .await
            .expect("failed to forward canframe to can module for transmission");
    }

    async fn receive(&self) -> Result<Timestamped<CanFrame>, Timestamped<CanError>> {
        let frame = self.rx.lock().await.recv().await;
        match frame {
            Some(frame) => Ok(frame),
            None => Err(Timestamped::now(CanError::Disconnect(format!(
                "can receive thread closed rx channel"
            )))),
        }
    }

    async fn receive_err(&self) -> Timestamped<CanError> {
        let error = self.err_rx.lock().await.recv().await;
        match error {
            Some(error) => error,
            None => Timestamped::now(CanError::Disconnect(format!("can receive thread closed rx channel"))),
        }
    }
}
