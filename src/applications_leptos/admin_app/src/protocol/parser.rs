use byteorder::{LittleEndian, ReadBytesExt};
use std::io::Cursor;

/// Parse HelloWorld response body (length-prefixed string)
pub fn parse_hello_world_body(data: &[u8]) -> Result<String, String> {
    if data.len() < 2 {
        return Err(format!("Body too short: {} bytes (need at least 2 for length)", data.len()));
    }

    let mut cursor = Cursor::new(data);

    // Read message_length (2 bytes, little-endian)
    let message_length = cursor.read_u16::<LittleEndian>()
        .map_err(|e| format!("Failed to read message_length: {}", e))? as usize;

    // Read message_data (NOT null-terminated!)
    let start_pos = 2; // After the 2-byte length field
    let end_pos = start_pos + message_length;

    if data.len() < end_pos {
        return Err(format!(
            "Body length mismatch: expected {} bytes, got {} bytes",
            end_pos,
            data.len()
        ));
    }

    let message_bytes = &data[start_pos..end_pos];

    // Convert to UTF-8 string
    String::from_utf8(message_bytes.to_vec())
        .map_err(|e| format!("Invalid UTF-8 in message: {}", e))
}

/// Generic parser for variable-length data (for future use)
pub struct MessageParser {
    data: Vec<u8>,
    cursor: usize,
}

impl MessageParser {
    pub fn new(data: Vec<u8>) -> Self {
        Self { data, cursor: 0 }
    }

    /// Read a length-prefixed string (uint16_t length + data)
    pub fn read_string(&mut self) -> Result<String, String> {
        if self.cursor + 2 > self.data.len() {
            return Err("Not enough data for string length".to_string());
        }

        let mut cursor = Cursor::new(&self.data[self.cursor..]);
        let len = cursor.read_u16::<LittleEndian>()
            .map_err(|e| format!("Failed to read string length: {}", e))? as usize;

        self.cursor += 2;

        if self.cursor + len > self.data.len() {
            return Err(format!(
                "String length {} exceeds remaining data {}",
                len,
                self.data.len() - self.cursor
            ));
        }

        let bytes = &self.data[self.cursor..self.cursor + len];
        self.cursor += len;

        String::from_utf8(bytes.to_vec())
            .map_err(|e| format!("Invalid UTF-8: {}", e))
    }

    pub fn read_u32(&mut self) -> Result<u32, String> {
        if self.cursor + 4 > self.data.len() {
            return Err("Not enough data for u32".to_string());
        }

        let mut cursor = Cursor::new(&self.data[self.cursor..]);
        let val = cursor.read_u32::<LittleEndian>()
            .map_err(|e| format!("Failed to read u32: {}", e))?;

        self.cursor += 4;
        Ok(val)
    }
}
