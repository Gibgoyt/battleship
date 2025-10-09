use crate::protocol::{MessageHeader, parse_hello_world_body};
use gloo_net::http::Request;

/// Response from HelloWorld endpoint
#[derive(Debug, Clone)]
pub struct HelloWorldResponse {
    pub header: MessageHeader,
    pub message: String,
}

/// Fetch hello world message from backend
pub async fn fetch_hello_world() -> Result<HelloWorldResponse, String> {
    // 1. Make HTTP request
    let response = Request::get("https://devbackend.splitdo.app:8443/hello")
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    // 2. Check HTTP status
    if !response.ok() {
        return Err(format!("HTTP error: {} {}", response.status(), response.status_text()));
    }

    // 3. Get binary body
    let binary_data = response.binary()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    // 4. Parse message header (first 12 bytes)
    if binary_data.len() < 12 {
        return Err(format!(
            "Response too short: {} bytes (expected at least 12 for header)",
            binary_data.len()
        ));
    }

    let header = MessageHeader::parse(&binary_data[0..12])?;

    // 5. Validate header
    if header.version != 1 {
        return Err(format!("Unsupported protocol version: {}", header.version));
    }

    if header.endpoint_id != 5 {
        return Err(format!(
            "Unexpected endpoint_id: {} (expected 5 for HELLO_WORLD)",
            header.endpoint_id
        ));
    }

    // 6. Parse body (after 12-byte header)
    let body_data = &binary_data[12..];

    if body_data.len() as u32 != header.body_length {
        return Err(format!(
            "Body length mismatch: header says {} bytes, got {} bytes",
            header.body_length,
            body_data.len()
        ));
    }

    let message = parse_hello_world_body(body_data)?;

    Ok(HelloWorldResponse { header, message })
}
