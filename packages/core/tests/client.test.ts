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
});
