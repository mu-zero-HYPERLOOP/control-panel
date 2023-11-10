// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rand::{rngs::StdRng, Rng, SeedableRng};
use std::{sync::Arc, time::Duration};
use tauri::Manager;

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
                println!("Hello, Tokio task");
                let mut rng = {
                    let rng = rand::thread_rng();
                    StdRng::from_rng(rng).unwrap()
                };
                loop {
                    tokio::time::sleep(Duration::from_millis(1000)).await;
                    let x = rng.gen::<u32>();
                    println!("emit event : {x}");
                    app_handle.emit_all("random-integer", x).unwrap();
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
