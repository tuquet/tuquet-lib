# @tuquet/utils

> Essential zero-dependency string and asynchronous utility helpers for Node.js and modern JavaScript runtimes.

[![npm version](https://img.shields.io/npm/v/@tuquet/utils.svg)](https://www.npmjs.com/package/@tuquet/utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Features

- 🪶 **Zero Dependencies**: Lightweight with no external dependencies.
- ⚡ **Dual Output**: Seamless support for ESM (`import`) and CJS (`require`).
- 🛡️ **Fully Typed**: Written in TypeScript with complete `.d.ts` and `.d.cts` declarations.
- 🌲 **Tree-shakeable**: Marked with `sideEffects: false` for optimal bundler dead-code elimination.

---

## 📦 Installation

```bash
# Using pnpm
pnpm add @tuquet/utils

# Using npm
npm install @tuquet/utils

# Using yarn
yarn add @tuquet/utils
```

---

## 📖 API Reference

### 🧵 String Utilities

#### `capitalize(str: string): string`

Capitalizes the first character of a string.

```typescript
import { capitalize } from '@tuquet/utils';

capitalize('tuquet'); // "Tuquet"
```

#### `truncate(str: string, maxLength: number, suffix?: string): string`

Truncates a string to a given length and appends a suffix (default: `...`).

```typescript
import { truncate } from '@tuquet/utils';

truncate('Super long text string', 12); // "Super lon..."
```

#### `slugify(text: string): string`

Converts arbitrary text into a clean, URL-safe slug.

```typescript
import { slugify } from '@tuquet/utils';

slugify('Hello World from Tuquet!'); // "hello-world-from-tuquet"
```

#### `camelCase(str: string): string`

Converts hyphenated, underscore, or space-separated words into camelCase.

```typescript
import { camelCase } from '@tuquet/utils';

camelCase('user-account-id'); // "userAccountId"
```

---

### ⏱️ Async Utilities

#### `sleep(ms: number): Promise<void>`

Pauses execution for a specified duration in milliseconds.

```typescript
import { sleep } from '@tuquet/utils';

await sleep(1000); // Waits 1 second
```

#### `retry<T>(fn: (attempt: number) => Promise<T>, options?: RetryOptions): Promise<T>`

Retries an asynchronous operation with exponential backoff.

```typescript
import { retry } from '@tuquet/utils';

const data = await retry(
  async (attempt) => {
    return await fetchApiEndpoint();
  },
  {
    maxRetries: 3,
    delayMs: 200,
    backoffFactor: 2,
  }
);
```

#### `withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage?: string): Promise<T>`

Rejects with an error if the promise does not settle within `timeoutMs`.

```typescript
import { withTimeout } from '@tuquet/utils';

const result = await withTimeout(fetchHeavyData(), 3000, 'Data fetching timed out');
```

---

## 📄 License

MIT © [Tuquet](https://github.com/tuquet)
