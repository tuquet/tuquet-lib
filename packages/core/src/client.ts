import { slugify, retry, withTimeout } from '@tuquet/utils';
import { Pipeline, type Middleware } from './pipeline.js';

export interface TuquetClientOptions {
  appName: string;
  timeoutMs?: number;
  maxRetries?: number;
  debug?: boolean;
}

export interface ExecutionContext {
  action: string;
  payload: Record<string, unknown>;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export class TuquetClient {
  readonly appName: string;
  readonly appSlug: string;
  private options: Required<TuquetClientOptions>;
  private pipeline: Pipeline<ExecutionContext>;

  constructor(options: TuquetClientOptions) {
    this.appName = options.appName;
    this.appSlug = slugify(options.appName);
    this.options = {
      appName: options.appName,
      timeoutMs: options.timeoutMs ?? 5000,
      maxRetries: options.maxRetries ?? 3,
      debug: options.debug ?? false,
    };
    this.pipeline = new Pipeline<ExecutionContext>();
  }

  /**
   * Add middleware to client pipeline.
   */
  use(middleware: Middleware<ExecutionContext>): this {
    this.pipeline.use(middleware);
    return this;
  }

  /**
   * Dispatch an action through the middleware pipeline with timeout and retry protection.
   */
  async dispatch(action: string, payload: Record<string, unknown> = {}): Promise<ExecutionContext> {
    const context: ExecutionContext = {
      action,
      payload,
      timestamp: Date.now(),
      metadata: {
        appSlug: this.appSlug,
      },
    };

    return retry(
      async () => {
        return withTimeout(
          this.pipeline.execute(context),
          this.options.timeoutMs,
          `Action "${action}" timed out after ${this.options.timeoutMs}ms`
        );
      },
      { maxRetries: this.options.maxRetries }
    );
  }
}
