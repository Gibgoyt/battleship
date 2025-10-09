use byteorder::{LittleEndian, ReadBytesExt};
use std::io::Cursor;

/// 12-byte binary message header (matches C backend struct)
#[derive(Debug, Clone)]
pub struct MessageHeader {
    pub total_length: u32,   // Bytes 0-3
    pub method: u8,          // Byte 4
    pub version: u8,         // Byte 5
    pub content_type: u8,    // Byte 6
    pub endpoint_id: u8,     // Byte 7
    pub body_length: u32,    // Bytes 8-11
}

impl MessageHeader {
    /// Parse 12-byte header from binary data
    pub fn parse(data: &[u8]) -> Result<Self, String> {
        if data.len() < 12 {
            return Err(format!("Header too short: {} bytes (expected 12)", data.len()));
        }

        let mut cursor = Cursor::new(data);

        Ok(Self {
            total_length: cursor.read_u32::<LittleEndian>()
                .map_err(|e| format!("Failed to read total_length: {}", e))?,
            method: cursor.read_u8()
                .map_err(|e| format!("Failed to read method: {}", e))?,
            version: cursor.read_u8()
                .map_err(|e| format!("Failed to read version: {}", e))?,
            content_type: cursor.read_u8()
                .map_err(|e| format!("Failed to read content_type: {}", e))?,
            endpoint_id: cursor.read_u8()
                .map_err(|e| format!("Failed to read endpoint_id: {}", e))?,
            body_length: cursor.read_u32::<LittleEndian>()
                .map_err(|e| format!("Failed to read body_length: {}", e))?,
        })
    }

    /// Get method name for display
    pub fn method_name(&self) -> &str {
        match self.method {
            1 => "GET",
            2 => "POST",
            3 => "PUT",
            4 => "DELETE",
            _ => "UNKNOWN",
        }
    }
}
