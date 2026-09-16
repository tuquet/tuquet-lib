import { TuquetClient } from '@tuquet/core';
import { capitalize, sleep } from '@tuquet/utils';

async function main() {
  console.log('🚀 Starting @tuquet example application...\n');

  const client = new TuquetClient({
    appName: 'Tuquet Demo Service',
    timeoutMs: 3000,
  });

  // Attach a logging middleware
  client.use(async (ctx, next) => {
    console.log(
      `[Middleware 1] Incoming action: ${ctx.action} at ${new Date(ctx.timestamp).toISOString()}`
    );
    await sleep(50); // simulate async step
    await next();
    console.log(`[Middleware 1] Action ${ctx.action} processed successfully!`);
  });

  // Attach an enrichment middleware
  client.use(async (ctx, next) => {
    ctx.payload.enriched = true;
    ctx.metadata.handler = 'DemoHandler';
    await next();
  });

  // Dispatch an action
  const result = await client.dispatch('notification:send', {
    recipient: 'user@example.com',
    message: capitalize('welcome to tuquet monorepo!'),
  });

  console.log('\n✅ Execution finished with result:');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('❌ Error running demo:', err);
  process.exit(1);
});
