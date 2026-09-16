import { describe, it, expect } from 'vitest';
import { TuquetClient } from '../src/client.js';

describe('TuquetClient', () => {
  it('initializes with appName and slugifies it', () => {
    const client = new TuquetClient({ appName: 'My Awesome Service' });
    expect(client.appName).toBe('My Awesome Service');
    expect(client.appSlug).toBe('my-awesome-service');
  });

  it('dispatches action through pipeline and enriches context', async () => {
    const client = new TuquetClient({ appName: 'Worker App' });

    client.use(async (ctx, next) => {
      ctx.metadata.processedBy = 'auth-middleware';
      await next();
    });

    const result = await client.dispatch('order:create', { orderId: '123' });
    expect(result.action).toBe('order:create');
    expect(result.payload).toEqual({ orderId: '123' });
    expect(result.metadata.appSlug).toBe('worker-app');
    expect(result.metadata.processedBy).toBe('auth-middleware');
    expect(typeof result.timestamp).toBe('number');
  });

  it('isolates context and does not pollute state across retries', async () => {
    const client = new TuquetClient({ appName: 'Retry App', maxRetries: 3 });
    let attempts = 0;

    client.use(async (ctx, next) => {
      attempts++;
      ctx.payload.count = ((ctx.payload.count as number) || 0) + 1;
      if (attempts < 2) {
        throw new Error('Temporary failure on attempt 1');
      }
      await next();
    });

    const initialPayload = { count: 0 };
    const result = await client.dispatch('retry:action', initialPayload);

    // Context is fresh on attempt 2, so count is 1 (0 + 1), not 2
    expect(result.payload.count).toBe(1);
    // Initial payload passed by caller is not mutated
    expect(initialPayload.count).toBe(0);
  });
});
