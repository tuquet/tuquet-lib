# Contributing to @tuquet Libraries

Thank you for your interest in contributing to `@tuquet` libraries!

---

## 🛠 Development Workflow

1. **Clone & Install:**

   ```bash
   git clone https://github.com/tuquet/tuquet-lib.git
   cd tuquet-lib
   pnpm install
   ```

2. **Run Builds & Tests:**

   ```bash
   pnpm build
   pnpm test
   ```

3. **Verify Code Quality:**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm format:check
   pnpm check:exports
   ```

---

## 📝 Commit Conventions & Changesets

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `refactor:` Code refactoring without behavior change
- `test:` Adding or fixing tests
- `chore:` Tooling and maintenance updates

### Adding a Changeset

Whenever you make a change that affects a publishable package:

```bash
pnpm changeset
```

Follow the interactive prompt to select packages, semver level (`patch`, `minor`, `major`), and provide a clear description.
Commit the generated `.changeset/*.md` file alongside your changes.

---

## 🚀 Creating Pull Requests

1. Create a feature branch from `main`: `git checkout -b feature/my-feature`.
2. Ensure all tests and lint checks pass.
3. Open a Pull Request targeting `main`.
