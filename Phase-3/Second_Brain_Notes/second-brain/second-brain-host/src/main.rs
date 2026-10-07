//! Second Brain — Chrome/Edge Native Messaging Host Companion Binary (CHANGE 18/24)
//!
//! Protocol:
//!   Chrome/Edge communicates with native messaging hosts via stdio:
//!   - 32-bit (4-byte) little-endian integer containing message byte length
//!   - Message payload in UTF-8 JSON
//!
//! This host reads the message from stdin, forwards it to the running
//! Second Brain Tauri application via Windows Named Pipe (`\\.\pipe\second-brain-nmh`),
//! waits for the application's response, and writes it back to stdout.

use std::io::{self, Read, Write};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

const PIPE_NAME: &str = r"\\.\pipe\second-brain-nmh";

#[tokio::main]
async fn main() {
    // 1. Read 4-byte length prefix from stdin
    let mut stdin = io::stdin().lock();
    let mut len_buf = [0u8; 4];
    if stdin.read_exact(&mut len_buf).is_err() {
        return;
    }

    let msg_len = u32::from_le_bytes(len_buf) as usize;
    if msg_len == 0 || msg_len > 1_048_576 {
        // Drop excessively large or empty messages
        write_error_response("Invalid or oversized message length");
        return;
    }

    // 2. Read JSON payload from stdin
    let mut msg_buf = vec![0u8; msg_len];
    if stdin.read_exact(&mut msg_buf).is_err() {
        write_error_response("Failed to read message from stdin");
        return;
    }
    drop(stdin);

    // 3. Connect to the Second Brain Named Pipe server
    let mut client = match tokio::net::windows::named_pipe::ClientOptions::new().open(PIPE_NAME) {
        Ok(c) => c,
        Err(e) => {
            write_error_response(&format!(
                "Second Brain desktop app is not running or pipe unavailable: {}",
                e
            ));
            return;
        }
    };

    // 4. Forward message to Named Pipe
    if client.write_all(&len_buf).await.is_err() || client.write_all(&msg_buf).await.is_err() {
        write_error_response("Failed to send message over named pipe");
        return;
    }
    if client.flush().await.is_err() {
        write_error_response("Failed to flush named pipe");
        return;
    }

    // 5. Read response from Named Pipe
    let mut resp_len_buf = [0u8; 4];
    if client.read_exact(&mut resp_len_buf).await.is_err() {
        write_error_response("Failed to read response length from named pipe");
        return;
    }

    let resp_len = u32::from_le_bytes(resp_len_buf) as usize;
    let mut resp_buf = vec![0u8; resp_len];
    if client.read_exact(&mut resp_buf).await.is_err() {
        write_error_response("Failed to read response body from named pipe");
        return;
    }

    // 6. Write response back to stdout for the browser extension
    let mut stdout = io::stdout().lock();
    let _ = stdout.write_all(&resp_len_buf);
    let _ = stdout.write_all(&resp_buf);
    let _ = stdout.flush();
}

fn write_error_response(error_msg: &str) {
    let json = serde_json::json!({
        "ok": false,
        "error": error_msg
    });
    if let Ok(bytes) = serde_json::to_vec(&json) {
        let len = (bytes.len() as u32).to_le_bytes();
        let mut stdout = io::stdout().lock();
        let _ = stdout.write_all(&len);
        let _ = stdout.write_all(&bytes);
        let _ = stdout.flush();
    }
}
