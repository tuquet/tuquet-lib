---
name: tuquet-library-authoring
description: Standards and blueprints for authoring, building, and testing @tuquet packages. Covers dual ESM/CJS compilation with tsup, strict TypeScript types, publint & attw export invariants, and Vitest test suites. Activate when creating or modifying @tuquet libraries.
---

# @tuquet Library Authoring Guide

Standards, recipes, and checklists for implementing new or modifying existing packages in `@tuquet/*`.

---

## 1. 📋 Blueprint for a New Library Package

When adding `@tuquet/<lib-name>`, follow this exact file structure:

```text
packages/<lib-name>/
├── src/
│   └── index.ts          # Main entrypoint with explicit exports
├── tests/
│   └── index.test.ts     # Vitest test suite
├── package.json          # Package manifest with dual conditional exports
├── tsconfig.json         # TypeScript configuration extending @tuquet/tsconfig/library.json
├── tsup.config.ts        # Bundler configuration
└── README.md             # Package documentation
```

---

## 2. 📦 Manifest Standard (`package.json`)

Ensure conditional exports are strictly defined with separate `types` keys for `import` and `require`:

```json
{
  "name": "@tuquet/<lib-name>",
  "version": "0.1.0",
  "description": "Short description of @tuquet/<lib-name>",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "engines": {
    "node": ">=18.0.0"
  },
  "sideEffects": false,
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/ --max-warnings 0",
    "check:exports": "publint",
    "clean": "rm -rf dist .turbo"
  },
  "devDependencies": {
    "@tuquet/eslint-config": "workspace:*",
    "@tuquet/tsconfig": "workspace:*",
    "publint": "^0.3.7",
    "tsup": "^8.4.0",
    "typescript": "^5.8.2",
    "vitest": "^3.0.8"
  }
}
```

---

## 3. ⚙️ Bundler Configuration (`tsup.config.ts`)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
});
```

---

## 4. 🧪 Testing Standards (Vitest)

- Unit tests reside in `packages/<lib-name>/tests/*.test.ts`.
- Tests import from the local source files (`../src/index.js` or `../src/module.js`).
- Fast assertions with Vitest's `describe`, `it`, `expect`.
- For async tests involving timers, use `vi.useFakeTimers()` or realistic async helpers.

---

## 5. ✅ Quality Verification Checklist

Before committing changes to any package, verify:

- [ ] `pnpm build` compiles without errors.
- [ ] `pnpm test` passes all test cases.
- [ ] `pnpm typecheck` produces 0 type errors.
- [ ] `pnpm lint` produces 0 warnings (`--max-warnings 0`).
- [ ] `pnpm check:exports` confirms publint reports `All good!`.
- [ ] Package `README.md` is updated with code snippets and API descriptions.
