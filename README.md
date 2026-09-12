# SelectionTranslator

SelectionTranslator 是一个面向 Windows 的低干扰划词 AI 工具。选中文本后，通过紧凑浮动菜单完成翻译、解释、润色和自定义 AI 动作，并保持当前工作流不断档。

## 主要能力

- Windows 全局划词与紧凑浮动工具栏
- 动态 Action / Prompt / Route / Fallback
- OpenAI Compatible、OpenAI Responses、Anthropic、Gemini 协议
- 自定义 Provider、模型、Headers 与生成参数
- 流式输出、Markdown / 纯文本结果
- 应用级划词规则与剪贴板回退
- Windows Credential Manager 保存 API Key
- Tauri + Rust + React / TypeScript

## 安装

稳定版安装包、MSI 与 Portable 版本请从 GitHub Releases 获取。

## 开发

```bash
pnpm install
pnpm tauri dev
```

常用检查：

```bash
pnpm check
pnpm build
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

## 版本规范

本项目从 `v1.0.0` 起采用 Semantic Versioning。详细规则见 [`docs/VERSIONING.md`](docs/VERSIONING.md)。

## 来源与致谢

SelectionTranslator 的产品交互与早期探索曾参考 Cherry Studio 的划词翻译体验、模型兼容设计和相关实现思路。SelectionTranslator 不是 Cherry Studio 的 fork，也不隶属于 Cherry Studio / CherryHQ。

由于开发过程中存在对 Cherry Studio AGPL-3.0 代码与实现的研究和参考，本项目选择以 GNU Affero General Public License v3.0 发布，以保持许可证兼容并避免来源边界不清带来的合规风险。详见 [`NOTICE`](NOTICE)。

## License

GNU Affero General Public License v3.0 (`AGPL-3.0-only`). See [`LICENSE`](LICENSE).
