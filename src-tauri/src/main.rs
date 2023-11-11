// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::{boxed::Box, sync::Arc};
use serialize::serialized_frame::SerializedFrame;

use crate::can::CNL;


mod can;
mod serialize;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    println!("Hello, World!");
    // setup tauri
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            println!("Hello, Tauri!");
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                // read config
                let network = can_yaml_config_rs::parse_yaml_config_from_file("./test.yaml").unwrap();
                // start CaNetwork Layer
                let mut cnl = CNL::create(&network);
                cnl.start();
                
                loop {
                    let frame = cnl.get_rx_message_receiver().recv().await.unwrap();
                    app_handle.emit_all("rx-frame", SerializedFrame::from(frame)).unwrap();
                    println!("received frame");
                }

            
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
