use std::{
    io::Write,
    os::windows::process::CommandExt,
    process::{Child, Command, Stdio},
    sync::Mutex,
};
use tauri::State;

const CREATE_NO_WINDOW: u32 = 0x08000000;
const MAX_SPEECH_CHARS: usize = 5000;

pub struct SpeechRuntime {
    child: Mutex<Option<Child>>,
}

impl SpeechRuntime {
    pub fn new() -> Self {
        Self {
            child: Mutex::new(None),
        }
    }
}

#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), String> {
    let url = url.trim();
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("only http/https URLs can be opened".into());
    }

    Command::new("rundll32.exe")
        .args(["url.dll,FileProtocolHandler", url])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("failed to open URL: {error}"))
}

#[tauri::command]
pub fn speak_text(state: State<'_, SpeechRuntime>, text: String) -> Result<(), String> {
    let text = text.trim();
    if text.is_empty() {
        return Err("speech text is empty".into());
    }
    if text.chars().count() > MAX_SPEECH_CHARS {
        return Err(format!("speech text exceeds {MAX_SPEECH_CHARS} characters"));
    }

    let mut active = state
        .child
        .lock()
        .map_err(|_| "speech runtime lock poisoned".to_string())?;

    if let Some(child) = active.as_mut() {
        let _ = child.kill();
    }

    let script = r#"
$stream = [Console]::OpenStandardInput()
$reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
$text = $reader.ReadToEnd()
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Speak($text)
"#;

    let mut child = Command::new("powershell.exe")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-WindowStyle",
            "Hidden",
            "-Command",
            script,
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|error| format!("failed to start speech synthesis: {error}"))?;

    let mut stdin = child
        .stdin
        .take()
        .ok_or_else(|| "speech process stdin is unavailable".to_string())?;
    stdin
        .write_all(text.as_bytes())
        .map_err(|error| format!("failed to send text to speech process: {error}"))?;
    drop(stdin);

    *active = Some(child);
    Ok(())
}
