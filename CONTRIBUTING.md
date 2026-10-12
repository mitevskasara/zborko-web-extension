# Contributing to ЗБОРко

Thanks for your interest in improving the extension! This document explains how to
get set up and how to submit changes.

## Code of Conduct

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- Report bugs and request features via [issues](https://github.com/mitevskasara/zborko-web-extension/issues).
- Improve the tooltip UI, Macedonian parsing, or the settings popup.
- Improve documentation.

## Development setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-username>/zborko-web-extension.git
   ```
2. Install dev dependencies (Prettier):
   ```bash
   npm install
   ```
3. Load the extension in Chrome:
   - Go to `chrome://extensions`.
   - Enable **Developer mode**.
   - Click **Load unpacked** and select the `src/` directory.

The source lives in `src/`. After editing, click the reload icon for the
extension on `chrome://extensions` and refresh the target page.

## Code style

- Formatting is enforced by [Prettier](https://prettier.io/). Run:
  ```bash
  npm run format        # write changes
  npm run format:check  # verify (used in CI)
  ```
- Prefer clear, small functions in the existing style (`src/index.js`,
  `src/popup.js`).
- Do not build DOM nodes with `innerHTML` for user-supplied text; use
  `textContent` (see existing code).

## Commit messages

Use short, imperative messages with an optional scope, for example:

```
feat: support multi-word selection
fix: keep tooltip inside the viewport on small screens
docs: clarify custom API configuration
```

## Submitting a pull request

1. Create a branch: `git checkout -b my-change`.
2. Make your change and ensure `npm run format:check` passes.
3. Describe **what** changed and **why** in the PR description.
4. Link any related issue.

Please keep pull requests focused. Large changes are easier to review when split
into smaller, self-contained commits.
