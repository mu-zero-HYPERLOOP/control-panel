use std::{
    sync::Arc,
    time::Instant,
};

use can_config_rs::config::NetworkRef;
use can_tcp_bridge_rs::frame::NetworkDescription;
use tokio::sync::Mutex;

use crate::cnl::can_adapter::CanAdapter;

use super::cnl_state::CNLState;

#[derive(Debug, Clone)]
pub enum NetworkConnectionCreateInfo {
    Tcp(NetworkDescription),
    #[cfg(feature = "socket-can")]
    SocketCan,
}

pub struct StartupState {
    network_config: Mutex<Option<NetworkRef>>,
    connections: Mutex<Vec<NetworkConnectionCreateInfo>>,
    established_connection: Mutex<(Vec<Arc<CanAdapter>>, Option<Instant>)>,
}

impl StartupState {
    pub fn new() -> Self {
        StartupState {
            network_config: Mutex::new(None),
            connections: Mutex::new(vec![]),
            established_connection: Mutex::new((vec![], None)),
        }
    }

    pub async fn set_network_config(&self, network_config: NetworkRef) {
        *self.network_config.lock().await = Some(network_config);
    }

    #[allow(unused)]
    pub async fn network_configuration(&self) -> Option<NetworkRef> {
        self.network_config.lock().await.as_ref().cloned()
    }

    pub async fn set_connections(&self, connections: Vec<NetworkConnectionCreateInfo>) {
        *self.connections.lock().await = connections;
    }

    pub async fn try_connect(
        &self,
        connection_index: usize,
        app_handle: &tauri::AppHandle,
    ) -> Result<(), String> {
        let connections_lock = self.connections.lock().await;
        let Some(connection) = connections_lock.get(connection_index) else {
            return Err("Fatal Error invalid connection index".to_owned());
        };

        let Some(network_ref) = self.network_config.lock().await.as_ref().cloned() else {
            return Err(
                "Failed to establish connection to server. No network configuration avaiable"
                    .to_owned(),
            );
        };

        match connection {
            NetworkConnectionCreateInfo::Tcp(nd) => {
                let can_adapters = CanAdapter::create_tcp_adapters(&network_ref, app_handle, nd)
                    .await
                    .map_err(|err| format!("{err:?}"))?;
                let adapters = can_adapters.into_iter().map(Arc::new).collect();
                *self.established_connection.lock().await = (adapters, Some(nd.timebase));
            }
            #[cfg(feature = "socket-can")]
            NetworkConnectionCreateInfo::SocketCan => {
                let can_adapter = CanAdapter::create_socketcan_adapters(&network_ref, app_handle)
                    .map_err(|err| format!("{err:?}"))?;
                *self.established_connection.lock().await = (
                    can_adapter.into_iter().map(Arc::new).collect(),
                    Some(Instant::now()),
                );
            }
        };
        Ok(())
    }

    pub async fn complete_setup(&self, app_handle: &tauri::AppHandle) -> Result<CNLState, String> {
        let Some(network_config) = self.network_config.lock().await.as_ref().cloned() else {
            return Err("Failed to complete setup. No network configuration avaiable".to_owned());
        };
        let can_adapters = self.established_connection.lock().await.0.clone();

        Ok(CNLState::create(
            network_config,
            app_handle,
            can_adapters,
            self.established_connection.lock().await.1.unwrap(),
        )
        .await)
    }
}
