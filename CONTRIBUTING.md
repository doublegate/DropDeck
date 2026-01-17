# Contributing to DropDeck

Thank you for your interest in contributing to DropDeck! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Bun](https://bun.sh/) >= 1.0
- [Node.js](https://nodejs.org/) >= 20.x (for compatibility)
- [Git](https://git-scm.com/)
- A code editor (we recommend [VS Code](https://code.visualstudio.com/) with the Biome extension)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/DropDeck.git
cd DropDeck
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/parobek/DropDeck.git
```

---

## Development Setup

### Install Dependencies

```bash
bun install
```

### Environment Configuration

1. Copy the environment template:

```bash
cp .env.example .env.local
```

2. Fill in the required environment variables (see `.env.example` for details)

### Database Setup

```bash
# Generate migrations from schema
bun run db:generate

# Apply migrations
bun run db:migrate

# (Optional) Open Drizzle Studio for database inspection
bun run db:studio
```

### Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

---

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots if applicable
- Your environment (OS, browser, Node.js version)

Use the [Bug Report template](./.github/ISSUE_TEMPLATE/bug_report.md) when creating issues.

### Suggesting Features

We welcome feature suggestions! Please use the [Feature Request template](./.github/ISSUE_TEMPLATE/feature_request.md) and include:

- A clear description of the problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered
- Additional context or mockups

### Submitting Code

1. **Find or create an issue** - All PRs should be linked to an issue
2. **Create a feature branch** - Branch from `main`
3. **Make your changes** - Follow the coding standards below
4. **Write tests** - Ensure adequate test coverage
5. **Submit a pull request** - Use the PR template

---

## Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true` in tsconfig.json)
- Define explicit types for function parameters and return values
- Avoid `any` type - use `unknown` when type is truly unknown
- Use interfaces for object shapes, types for unions/primitives

### Formatting and Linting

We use [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check formatting and linting
bun run check

# Auto-fix issues
bun run lint --write
bun run format
```

### Code Style

- **Indentation:** 2 spaces
- **Quotes:** Single quotes for strings
- **Semicolons:** Always use semicolons
- **Line Width:** Maximum 100 characters
- **Imports:** Organize imports (auto-sorted by Biome)

### File Naming

- **Components:** PascalCase (`DeliveryCard.tsx`)
- **Utilities:** camelCase (`formatDuration.ts`)
- **Types:** PascalCase (`Platform.ts`)
- **Tests:** Same name with `.test.ts` or `.spec.ts` suffix

### Component Guidelines

- Use Server Components by default (Next.js 15)
- Add `'use client'` directive only when client-side features are needed
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks

### Testing

- Write tests for all new features
- Aim for meaningful coverage, not just line coverage
- Use descriptive test names
- Mock external dependencies appropriately

```bash
# Run unit tests
bun run test

# Run E2E tests
bun run test:e2e

# Run tests in watch mode
bun run test --watch
```

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Changes that don't affect code meaning (formatting) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `build` | Changes to build system or dependencies |
| `ci` | Changes to CI configuration |
| `chore` | Other changes that don't modify src or test files |

### Examples

```bash
feat(adapters): add Instacart platform adapter

fix(map): correct driver marker position interpolation

docs(readme): update installation instructions

refactor(auth): extract token refresh logic into separate module
```

### Rules

- Use the imperative mood ("add feature" not "added feature")
- Don't capitalize the first letter of the description
- No period at the end of the description
- Keep the description under 72 characters
- Use the body to explain "what" and "why", not "how"

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream:**

```bash
git fetch upstream
git rebase upstream/main
```

2. **Run all checks:**

```bash
bun run check
bun run test
bun run build
```

3. **Ensure your branch is up to date with `main`**

### PR Guidelines

- Fill out the [Pull Request template](./.github/PULL_REQUEST_TEMPLATE.md) completely
- Link to the related issue(s)
- Keep PRs focused - one feature/fix per PR
- Add screenshots for UI changes
- Ensure all CI checks pass

### Review Process

1. At least one maintainer must approve the PR
2. All conversations must be resolved
3. CI checks must pass
4. Branch must be up to date with `main`

### After Merge

- Delete your feature branch
- Update any related issues

---

## Documentation

### Code Documentation

- Add JSDoc comments for public functions and components
- Document complex algorithms with inline comments
- Keep README files up to date

### Project Documentation

Documentation is located in the `docs/` directory. When making changes that affect documentation:

1. Update relevant documentation files
2. Ensure links are valid
3. Follow the existing documentation style

---

## Questions?

If you have questions about contributing, feel free to:

- Open a [discussion](https://github.com/parobek/DropDeck/discussions)
- Check existing [issues](https://github.com/parobek/DropDeck/issues)

Thank you for contributing to DropDeck!
