use fonttools::{font::Font, tag};
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub fn add_table(left: &[u8], tag: String, right: &[u8]) -> Vec<u8> {
    if let Ok(mut font) = Font::from_bytes(left) {
        if tag == "CPAL" {
            font.tables.insert_raw(tag!("CPAL"), right);
        } else if tag == "COLR" {
            font.tables.insert_raw(tag!("COLR"), right);
        }
        let mut buf = Vec::with_capacity(left.len());
        if font.write(&mut buf).is_ok() {
            buf
        } else {
            vec![]
        }
    } else {
        vec![]
    }
}
