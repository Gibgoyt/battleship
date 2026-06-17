// Thin WebSocket wrapper for the monopoly worker.
//
// Connects to wss://<host>/ws?p=<sha256(password)>, sends/receives JSON
// messages, and reconnects with a simple back-off on transport failure.

use leptos::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{MessageEvent, WebSocket};

use crate::state::GameSnapshot;

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "t", rename_all = "camelCase")]
pub enum ClientMsg {
    Hello { #[serde(skip_serializing_if = "Option::is_none")] #[serde(rename = "seatToken")] seat_token: Option<String> },
    Join  { #[serde(rename = "displayName")] display_name: String },
    Leave,
    Ready { value: bool },
    Roll,
    Buy,
    Skip,
    EndTurn,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(tag = "t")]
pub enum ServerMsg {
    #[serde(rename = "welcome")]
    Welcome { seat: Option<u32>, #[serde(rename = "seatToken")] seat_token: Option<String> },
    #[serde(rename = "state")]
    State   { state: GameSnapshot },
    #[serde(rename = "event")]
    Event   { kind: String, payload: Value },
    #[serde(rename = "kicked")]
    Kicked  { reason: String },
    #[serde(rename = "error")]
    Error   { message: String },
}

/// Connection status surfaced to the UI.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ConnStatus { Connecting, Open, Closed }

pub struct Conn {
    ws: RefCell<Option<WebSocket>>,
    url: String,
    // sticky handlers — keep closures alive while the socket is open
    _on_open:  RefCell<Option<Closure<dyn FnMut(JsValue)>>>,
    _on_msg:   RefCell<Option<Closure<dyn FnMut(MessageEvent)>>>,
    _on_close: RefCell<Option<Closure<dyn FnMut(JsValue)>>>,
    _on_err:   RefCell<Option<Closure<dyn FnMut(JsValue)>>>,
}

impl Conn {
    pub fn new(url: String) -> Rc<Self> {
        Rc::new(Self {
            ws: RefCell::new(None),
            url,
            _on_open:  RefCell::new(None),
            _on_msg:   RefCell::new(None),
            _on_close: RefCell::new(None),
            _on_err:   RefCell::new(None),
        })
    }

    /// Open the WS. `on_msg` is invoked for every successfully-decoded
    /// server message; `on_status` reports Open/Closed/Connecting.
    pub fn connect<F, G>(self: &Rc<Self>, mut on_msg: F, on_status: G)
    where
        F: FnMut(ServerMsg) + 'static,
        G: FnMut(ConnStatus) + Clone + 'static,
    {
        let mut on_status_init = on_status.clone();
        on_status_init(ConnStatus::Connecting);
        let ws = match WebSocket::new(&self.url) {
            Ok(ws) => ws,
            Err(e) => {
                web_sys::console::error_2(&JsValue::from_str("ws ctor failed"), &e);
                let mut on_status_fail = on_status.clone();
                on_status_fail(ConnStatus::Closed);
                return;
            }
        };
        ws.set_binary_type(web_sys::BinaryType::Arraybuffer);

        let me = Rc::clone(self);
        let mut on_status_open = on_status.clone();
        let open_cb = Closure::wrap(Box::new(move |_e: JsValue| {
            on_status_open(ConnStatus::Open);
        }) as Box<dyn FnMut(JsValue)>);
        ws.set_onopen(Some(open_cb.as_ref().unchecked_ref()));
        *me._on_open.borrow_mut() = Some(open_cb);

        let msg_cb = Closure::wrap(Box::new(move |e: MessageEvent| {
            let data = e.data();
            let text = if let Some(s) = data.as_string() {
                s
            } else if let Ok(ab) = data.dyn_into::<js_sys::ArrayBuffer>() {
                let arr = js_sys::Uint8Array::new(&ab);
                let mut buf = vec![0u8; arr.length() as usize];
                arr.copy_to(&mut buf);
                String::from_utf8_lossy(&buf).into_owned()
            } else {
                return;
            };
            match serde_json::from_str::<ServerMsg>(&text) {
                Ok(m) => on_msg(m),
                Err(err) => web_sys::console::warn_2(
                    &JsValue::from_str(&format!("ws decode error: {err}")),
                    &JsValue::from_str(&text),
                ),
            }
        }) as Box<dyn FnMut(MessageEvent)>);
        ws.set_onmessage(Some(msg_cb.as_ref().unchecked_ref()));
        *me._on_msg.borrow_mut() = Some(msg_cb);

        let mut on_status_close = on_status.clone();
        let close_cb = Closure::wrap(Box::new(move |_e: JsValue| {
            on_status_close(ConnStatus::Closed);
        }) as Box<dyn FnMut(JsValue)>);
        ws.set_onclose(Some(close_cb.as_ref().unchecked_ref()));
        *me._on_close.borrow_mut() = Some(close_cb);

        let err_cb = Closure::wrap(Box::new(move |e: JsValue| {
            web_sys::console::warn_2(&JsValue::from_str("ws error"), &e);
        }) as Box<dyn FnMut(JsValue)>);
        ws.set_onerror(Some(err_cb.as_ref().unchecked_ref()));
        *me._on_err.borrow_mut() = Some(err_cb);

        *me.ws.borrow_mut() = Some(ws);
    }

    pub fn send(&self, msg: &ClientMsg) {
        let ws = self.ws.borrow();
        let Some(ws) = ws.as_ref() else { return };
        if ws.ready_state() != WebSocket::OPEN {
            web_sys::console::warn_1(&JsValue::from_str("ws not open; drop msg"));
            return;
        }
        match serde_json::to_string(msg) {
            Ok(s) => { let _ = ws.send_with_str(&s); }
            Err(e) => web_sys::console::error_1(&JsValue::from_str(&format!("encode err: {e}"))),
        }
    }

    pub fn close(&self) {
        if let Some(ws) = self.ws.borrow_mut().take() {
            let _ = ws.close();
        }
    }
}
