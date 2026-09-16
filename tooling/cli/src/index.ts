import { intro, outro, select, spinner, isCancel, cancel } from '@clack/prompts';
import pc from 'picocolors';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCreatePackage } from './create-package.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

async function main() {
  console.log();
  intro(pc.bgMagenta(pc.black(' @tuquet Monorepo Developer Suite ')));

  while (true) {
    const action = await select({
      message: 'Select a task to perform:',
      options: [
        { value: 'create', label: '🚀 Scaffold a new @tuquet library package' },
        { value: 'build', label: '📦 Build all packages (Turborepo)' },
        { value: 'test', label: '🧪 Run all test suites (Vitest)' },
        { value: 'typecheck', label: '🛡️  Typecheck all packages' },
        { value: 'lint', label: '🧹 Lint & Auto-fix code' },
        { value: 'exports', label: '🔍 Validate package exports (publint)' },
        { value: 'demo', label: '🎮 Run Node Demo app' },
        { value: 'changeset', label: '📝 Create a Changeset' },
        { value: 'exit', label: '🚪 Exit' },
      ],
    });

    if (isCancel(action) || action === 'exit') {
      outro(pc.yellow('Goodbye! Happy hacking with @tuquet! 🚀'));
      process.exit(0);
    }

    if (action === 'create') {
      await runCreatePackage();
      continue;
    }

    const s = spinner();

    try {
      switch (action) {
        case 'build':
          s.start('Building all packages with Turborepo...');
          execSync('pnpm build', { cwd: rootDir, stdio: 'inherit' });
          s.stop(pc.green('Build completed successfully!'));
          break;
        case 'test':
          s.start('Running unit tests with Vitest...');
          execSync('pnpm test', { cwd: rootDir, stdio: 'inherit' });
          s.stop(pc.green('All test suites passed!'));
          break;
        case 'typecheck':
          s.start('Checking TypeScript types across workspace...');
          execSync('pnpm typecheck', { cwd: rootDir, stdio: 'inherit' });
          s.stop(pc.green('Typecheck passed with 0 errors!'));
          break;
        case 'lint':
          s.start('Linting code...');
          execSync('pnpm lint:fix', { cwd: rootDir, stdio: 'inherit' });
          s.stop(pc.green('Linting and auto-fix finished!'));
          break;
        case 'exports':
          s.start('Validating package exports with publint...');
          execSync('pnpm check:exports', { cwd: rootDir, stdio: 'inherit' });
          s.stop(pc.green('All package exports are 100% compliant!'));
          break;
        case 'demo':
          console.log(pc.cyan('\nStarting example application: node-demo...\n'));
          execSync('pnpm --filter node-demo start', { cwd: rootDir, stdio: 'inherit' });
          break;
        case 'changeset':
          execSync('pnpm changeset', { cwd: rootDir, stdio: 'inherit' });
          break;
      }
    } catch (err) {
      s.stop(pc.red('Task failed. See logs above.'));
    }

    console.log();
  }
}

main().catch((err) => {
  console.error(pc.red('Fatal error:'), err);
  process.exit(1);
});
