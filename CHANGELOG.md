# Changelog

All notable public changes to SelectionTranslator are documented here.

The project follows Semantic Versioning from v1.0.0 onward.

## [1.0.0] - 2026-09-11

First public stable release.

### Added
- Windows global text-selection toolbar and result window.
- Translation, explanation, polishing and dynamic custom AI actions.
- Provider profiles, model routing, fallback routes and prompt templates.
- OpenAI Compatible, OpenAI Responses, Anthropic and Gemini adapters.
- Model capability handling for sampling and reasoning options.
- Custom headers and model-list retrieval.
- Application rules and clipboard fallback compatibility.
- Windows Credential Manager-backed API key storage.
- Diagnostics logging without selected text, prompts or API keys.
- Settings center with provider, action, selection, app-rule and general pages.
- Minimize / maximize support and separate compact selection-result sizing.

### Fixed
- Chinese toolbar labels no longer collapse vertically.
- Single-provider API failures preserve real error kind and HTTP status.
- API key storage now uses the Windows-native keyring backend and verifies round-trip persistence.
- Settings and home windows open at a usable default size.

### Notes
- Internal `0.x` builds were development snapshots and are not part of the public release history.
