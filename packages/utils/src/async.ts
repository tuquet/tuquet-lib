/**
 * Pauses execution for a specified duration in milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffFactor?: number;
}

/**
 * Retries an asynchronous operation up to maxRetries times with exponential backoff.
 */
export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 100, backoffFactor = 2 } = options;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await sleep(currentDelay);
      currentDelay *= backoffFactor;
    }
  }

  throw new Error('Retry failed unexpectedly');
}

/**
 * Wraps a promise with a timeout. If the promise does not settle within timeoutMs, rejects with an error.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = `Operation timed out after ${timeoutMs}ms`
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
