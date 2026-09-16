# @tuquet/cli

> Interactive developer suite and package scaffolding wizard for the @tuquet monorepo.

Powered by [@clack/prompts](https://github.com/natemoo-re/clack) and [picocolors](https://github.com/alexeyraspopov/picocolors).

---

## 🚀 Usage

### 1. Launch Master Developer Menu

```bash
pnpm wizard
```

### 2. Direct Package Scaffolding

```bash
pnpm create-pkg
```

---

## 🌟 Capabilities

- 🧙 **Interactive Scaffolding**: Create a new `@tuquet/<name>` package with automated:
  - `package.json` with perfect dual ESM/CJS exports
  - `tsconfig.json` extending `@tuquet/tsconfig/library.json`
  - `tsup.config.ts` dual bundler configuration
  - `src/index.ts` and `tests/index.test.ts`
  - `README.md`
  - Root `tsconfig.json` references auto-update
  - Automated `pnpm install` and initial build verification
- ⚡ **Task Runner**: Execute builds, tests, typechecking, linting, publint validation, and changesets from an interactive terminal UI.
