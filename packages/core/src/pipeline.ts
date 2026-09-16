export type Middleware<T> = (context: T, next: () => Promise<void>) => Promise<void> | void;

/**
 * A generic async middleware pipeline for processing context objects.
 */
export class Pipeline<T> {
  private middlewares: Middleware<T>[] = [];

  /**
   * Registers one or more middlewares into the pipeline.
   */
  use(...middlewares: Middleware<T>[]): this {
    this.middlewares.push(...middlewares);
    return this;
  }

  /**
   * Executes the pipeline against the provided context.
   */
  async execute(context: T): Promise<T> {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      const fn = this.middlewares[i];
      if (!fn) return;

      await fn(context, () => dispatch(i + 1));
    };

    await dispatch(0);
    return context;
  }
}
