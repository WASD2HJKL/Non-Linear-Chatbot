# Changelog

All notable changes to this project will be documented in this file.

## [v0.0.2] - 2025-08-27

- Overview: Pre-commit hooks added, ESLint v9 flat config adopted, significant TS hardening, multi-provider enhancements, UI improvements, and several bug fixes since v0.0.1.

### Added

- Pre-commit workflow: Husky + lint-staged to auto-fix on commit.
- Conversation title feature for easier navigation on home page.
- Conversation deletion: Soft delete with dropdown UI.
- Node deletion with recursive descendant removal.
- Display full code blocks in expanded conversation nodes.
- Summary generation migrated from env vars to config-based approach.
- Local agent configuration scaffold.
- Multi-provider support and related cleanup.
- Expand/Collapse All with auto layout integration.
- User profile dropdown with logout on homepage.
- Additional model entries (e.g., GPT-5, GPT-OSS).

### Changed

- Linting: Adopt ESLint v9 flat config with type-aware rules, `eslint-plugin-react-hooks@^5`, and Prettier compatibility.
- TypeScript: Replace `any` with `unknown` at boundaries; add narrowing and explicit types for server operations, error normalization, and provider config.
- Middleware: Align OpenAI stream middleware typing with Wasp’s `MiddlewareConfig`; add OPTIONS handler, custom CORS, and rate limiting wrapper.

### Fixed

- ESLint error after config migration.
- Client/server logger import boundary.
- Chat UX: Scrolling during streaming and node navigation.
- Loading spinner alignment.
- Switching conversations: “Parent node not found” error.
- Runtime: useTreeLayout temporal initialization bug (define fallback before use).

### Documentation

- Enhanced README with new features and Chinese translation.
- GitHub badge: Link to stargazers and improved styling.
- Updated repository links; removed outdated sections.

### Chore / Build

- Deployment and model configuration updates.
- Code formatting and cleanup; removed unused middleware/tests.
- Package updates.

---

Full diff since v0.1.0:
https://github.com/WASD2HJKL/Non-Linear-Chatbot/compare/v0.0.1...HEAD
