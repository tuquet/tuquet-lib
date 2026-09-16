# @tuquet/core

> Core engine and middleware orchestration pipeline for @tuquet Node.js libraries.

[![npm version](https://img.shields.io/npm/v/@tuquet/core.svg)](https://www.npmjs.com/package/@tuquet/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Features

- ⚡ **Async Middleware Pipeline**: Onion-style middleware execution model (`ctx`, `next`) with re-entrancy protection.
- 🔁 **Built-in Resilience**: Configurable automatic retries with exponential backoff on action dispatching.
- ⏱️ **Timeout Protection**: Guard asynchronous actions against indefinite hanging.
- 📦 **Dual Packaging**: Ships both modern ECMAScript Modules (ESM) and CommonJS (CJS) bundles.
- 🏷️ **Type Safe**: First-class TypeScript definitions generated automatically (`.d.ts` and `.d.cts`).

---

## 📦 Installation

```bash
# Using pnpm
pnpm add @tuquet/core

# Using npm
npm install @tuquet/core

# Using yarn
yarn add @tuquet/core
```

---

## 🚀 Quick Start

```typescript
import { TuquetClient } from '@tuquet/core';

// 1. Initialize client with options
const client = new TuquetClient({
  appName: 'Payment Gateway',
  timeoutMs: 5000,
  maxRetries: 3,
});

// 2. Register middleware
client.use(async (ctx, next) => {
  console.log(`[Before] Dispatching action: ${ctx.action}`);
  const start = Date.now();

  await next();

  const duration = Date.now() - start;
  console.log(`[After] Completed in ${duration}ms`);
});

// 3. Dispatch an action
const result = await client.dispatch('order:process', {
  orderId: 'ORD-9981',
  amount: 250.0,
});

console.log('Result:', result);
```

---

## 📖 API Reference

### `new TuquetClient(options: TuquetClientOptions)`

Creates a new client instance.

#### Options:

- `appName` (`string`, required): Identifier of your application. Automatically converted to slug form.
- `timeoutMs` (`number`, optional, default: `5000`): Maximum duration allowed for an action before timing out.
- `maxRetries` (`number`, optional, default: `3`): Number of retry attempts on dispatch failure.
- `debug` (`boolean`, optional, default: `false`): Enables verbose debugging logs.

#### Methods:

- `client.use(middleware: Middleware<ExecutionContext>): this`: Registers a middleware function.
- `client.dispatch(action: string, payload?: Record<string, unknown>): Promise<ExecutionContext>`: Dispatches an action through the middleware stack.

### `Pipeline<T>`

Generic async middleware runner for custom data flow.

```typescript
import { Pipeline } from '@tuquet/core';

interface RequestContext {
  userId: string;
  authenticated: boolean;
}

const pipeline = new Pipeline<RequestContext>();

pipeline.use(async (ctx, next) => {
  if (ctx.userId === 'admin') {
    ctx.authenticated = true;
  }
  await next();
});

const ctx = await pipeline.execute({ userId: 'admin', authenticated: false });
```

---

## 📄 License

MIT © [Tuquet](https://github.com/tuquet)
