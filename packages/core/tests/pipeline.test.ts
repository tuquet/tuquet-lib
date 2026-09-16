import { describe, it, expect } from 'vitest';
import { Pipeline } from '../src/pipeline.js';

describe('Pipeline', () => {
  it('executes middlewares in sequence', async () => {
    const pipeline = new Pipeline<{ steps: string[] }>();

    pipeline.use(async (ctx, next) => {
      ctx.steps.push('first:enter');
      await next();
      ctx.steps.push('first:exit');
    });

    pipeline.use(async (ctx, next) => {
      ctx.steps.push('second');
      await next();
    });

    const result = await pipeline.execute({ steps: [] });
    expect(result.steps).toEqual(['first:enter', 'second', 'first:exit']);
  });

  it('handles empty middleware list gracefully', async () => {
    const pipeline = new Pipeline<{ val: number }>();
    const result = await pipeline.execute({ val: 42 });
    expect(result.val).toBe(42);
  });
});
