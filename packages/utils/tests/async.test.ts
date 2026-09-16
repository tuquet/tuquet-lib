import { describe, it, expect } from 'vitest';
import { sleep, retry, withTimeout } from '../src/async.js';

describe('async utils', () => {
  describe('sleep', () => {
    it('pauses execution for the specified time', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });
  });

  describe('retry', () => {
    it('succeeds on first try if no error', async () => {
      let attempts = 0;
      const result = await retry(async () => {
        attempts++;
        return 'success';
      });
      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('executes at least once even if maxRetries is 0', async () => {
      const result = await retry(async () => 'ok', { maxRetries: 0 });
      expect(result).toBe('ok');
    });

    it('retries until success', async () => {
      let attempts = 0;
      const result = await retry(
        async (att) => {
          attempts = att;
          if (att < 3) throw new Error('Temporary failure');
          return 'recovered';
        },
        { maxRetries: 3, delayMs: 10, backoffFactor: 1 }
      );
      expect(result).toBe('recovered');
      expect(attempts).toBe(3);
    });

    it('throws when maximum retries exceeded', async () => {
      await expect(
        retry(
          async () => {
            throw new Error('Always fails');
          },
          { maxRetries: 2, delayMs: 10 }
        )
      ).rejects.toThrow('Always fails');
    });
  });

  describe('withTimeout', () => {
    it('resolves if promise finishes in time', async () => {
      const promise = sleep(20).then(() => 'done');
      const result = await withTimeout(promise, 100);
      expect(result).toBe('done');
    });

    it('rejects if promise takes too long', async () => {
      const promise = sleep(100).then(() => 'slow');
      await expect(withTimeout(promise, 20)).rejects.toThrow('Operation timed out');
    });
  });
});
