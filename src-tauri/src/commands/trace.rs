use crate::{cnl::trace::TraceObjectEvent, state::cnl_state::CNLState};



#[tauri::command]
pub async fn listen_to_trace(state: tauri::State<'_, CNLState>) -> Result<Vec<TraceObjectEvent>, ()> {
    println!("listen to trace");
    let trace = state.lock().await.trace().clone();
    trace.listen();
    Ok(trace.get().await)
}

#[tauri::command]
pub async fn unlisten_to_trace(state: tauri::State<'_, CNLState>) -> Result<(), ()> {
    println!("unlisten from trace");
    state.lock().await.trace().unlisten().await;
    Ok(())
}
