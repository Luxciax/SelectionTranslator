# SelectionTranslator

SelectionTranslator is a low-distraction AI selection tool for Windows. Select text anywhere, open a compact floating toolbar, and run translation, explanation, polishing, or custom AI actions without leaving your current workflow.

## Features

- System-wide text selection on Windows
- Compact floating action toolbar
- Translation, explanation, polishing, and custom AI actions
- Dynamic Action / Prompt / Route / Fallback architecture
- OpenAI-compatible Chat Completions
- OpenAI Responses API
- Anthropic Messages API
- Google Gemini API
- Custom providers, models, request headers, and generation options
- Streaming responses with Markdown or plain-text output
- Per-application selection rules and clipboard fallback
- Windows Credential Manager integration for provider credentials
- Tauri + Rust backend with React + TypeScript frontend

## Downloads

Stable Windows builds are available from GitHub Releases:

https://github.com/Luxciax/SelectionTranslator/releases/latest

The current release provides:

- `SelectionTranslator_1.0.0_x64-setup.exe` — recommended Windows installer
- `SelectionTranslator_1.0.0_x64_en-US.msi` — MSI package
- `SelectionTranslator_1.0.0_x64_Portable.exe` — portable executable
- `SHA256SUMS.txt` — SHA-256 checksums

## Credential Handling

No personal provider credentials are bundled with this repository.

Credentials supplied through the application settings are stored at runtime using Windows Credential Manager. The source tree contains only public provider endpoints, protocol field names, and empty/default placeholders required by the application.

Local environment files and build artifacts are excluded from Git through `.gitignore`.

## Development

Requirements:

- Windows
- Node.js
- pnpm
- Rust toolchain with the MSVC target
- Tauri prerequisites

Install dependencies and start the development build:

```bash
pnpm install
pnpm tauri dev
```

Common validation commands:

```bash
pnpm check
pnpm build
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

Build Windows release packages:

```bash
pnpm tauri build
```

## Versioning

SelectionTranslator follows Semantic Versioning starting with the first public stable release, `v1.0.0`.

- **MAJOR** — incompatible configuration, behavior, or public-contract changes
- **MINOR** — backward-compatible features and new capabilities
- **PATCH** — backward-compatible fixes, compatibility updates, and small UX improvements

See [`docs/VERSIONING.md`](docs/VERSIONING.md) for the complete release policy.

## Attribution

SelectionTranslator is an independent project. Its product design and early implementation research were informed by Cherry Studio, including its selection-translation interaction patterns and model-provider compatibility concepts.

Cherry Studio is developed by CherryHQ and its contributors and is distributed under the GNU Affero General Public License v3.0.

Official Cherry Studio repository:
https://github.com/CherryHQ/cherry-studio

SelectionTranslator is not affiliated with, endorsed by, or an official fork of Cherry Studio or CherryHQ. See [`NOTICE`](NOTICE) for the full attribution statement.

## License

SelectionTranslator is distributed under the **GNU Affero General Public License v3.0 (`AGPL-3.0-only`)**.

See [`LICENSE`](LICENSE) for the full license text.
