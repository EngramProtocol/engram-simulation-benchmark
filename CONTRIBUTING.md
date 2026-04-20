# Contributing to ENGRAM Simulation Benchmark

Thank you for your interest in contributing! This document provides guidelines for reporting issues, suggesting improvements, and submitting pull requests.

## Code of Conduct

Be respectful and constructive in all interactions. This project is open to everyone and we value diverse perspectives.

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/yourusername/engram-simulation-benchmark.git
cd engram-simulation-benchmark
npm install
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

## Development Workflow

### Running Tests

```bash
# Syntax check
node -c bench/benchmark.js

# Run a specific benchmark
node bench/benchmark.js
```

### Code Style

- Use 4-space indentation
- Follow JavaScript conventions from existing code
- Add comments for complex logic
- Use meaningful variable names

### Commit Messages

Format: `[type] subject`

Examples:
- `[feat] Add CPU efficiency benchmark`
- `[fix] Correct latency calculation in Stage 3`
- `[docs] Update README with new parameters`
- `[refactor] Simplify retrieval simulation logic`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Pull Request Process

### Before Submitting

1. **Ensure English-only comments**: All code comments and documentation must be in English
2. **Update documentation**: If adding features, update README.md
3. **Add examples**: Include example usage in PR description
4. **Test thoroughly**: Run benchmarks with various parameters

### Submission

1. Push your branch: `git push origin feature/your-feature`
2. Create a Pull Request on GitHub
3. Provide clear description:
   - What does it do?
   - Why is this change needed?
   - How can reviewers test it?

### PR Review

- Respond promptly to feedback
- Make requested changes in new commits
- Rebase/squash before merge if requested

## Adding New Benchmarks

### Structure

```javascript
// File: bench/my_new_benchmark.js

const logger = require('winston').createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
});

const CONFIG = {
    RPC_ENDPOINT: process.env.ENGRAM_RPC || 'http://localhost:26657',
    ITERATIONS: 100
};

async function runBenchmark() {
    logger.info('🚀 Starting my new benchmark...');
    // Implementation
    logger.info('✅ Benchmark complete!');
}

module.exports = { runBenchmark };
```

### Naming Conventions

- File: `{name}_benchmark.js` or `{name}_simulation.js`
- Function: `run{Name}Benchmark()` or `run{Name}Simulation()`
- Metric prefix: Use consistent emoji in logs
  - `🚀` - Start
  - `📊` - Statistics
  - `✅` - Success
  - `❌` - Error
  - `⚠️` - Warning
  - `⏳` - Waiting
  - `📥` - Input/Collection

### Logging Format

```javascript
// Always include context: peer ID, heights, values
logger.info(`RDA|SYNC|RECEIVE peer=${peerId} col=0 row=5`);

// Include percentile stats
console.log(`| p50 (Med) | p95       | p99       |`);
```

## Reporting Bugs

### Before Reporting

1. Check existing [issues](https://github.com/yourusername/engram-simulation-benchmark/issues)
2. Verify with latest code: `git pull origin main`
3. Test with minimal example

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Run command X
2. Observe result Y
3. Expected result Z

**Environment**
- Node.js: v18.0.0
- npm: v9.0.0
- OS: macOS/Linux/Windows

**Logs**
```
<paste error output>
```

**Additional Context**
Any other relevant information
```

## Feature Requests

### Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Use Case**
When would someone use this?

**Alternatives Considered**
Other approaches you've thought about
```

## Documentation

### Adding to README

When contributing new features:
1. Add a section under appropriate heading
2. Include command examples
3. Show expected output
4. Add troubleshooting tips if relevant

### Code Comments

```javascript
// Good: Explains WHY
// Calculate max latency as 95th percentile for representative performance
const p95 = getPercentile(latencies, 95);

// Avoid: Explains WHAT (code already shows this)
// Set p95 to percentile 95
const p95 = getPercentile(latencies, 95);
```

## Performance Guidelines

- Benchmarks should complete in <1 hour for CI/CD
- Large simulations (>100k iterations) should be optional
- Use sampling for huge datasets
- Monitor memory usage (Node default: 2GB)

## Version Management

We use semantic versioning: `MAJOR.MINOR.PATCH`

- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- 📧 Email maintainers
- 💬 Create a discussion issue
- 📖 Check existing documentation

Thank you for contributing! 🙏
