# Quick Start Guide

Get up and running in 5 minutes!

## 1. Prerequisites Check (1 minute)

```bash
# Check Node.js
node --version    # Should be v18.0.0 or higher
npm --version     # Should be v9.0.0 or higher

# If not installed:
# macOS: brew install node
# Linux: sudo apt install nodejs npm
# Windows: Download from https://nodejs.org/
```

## 2. Install (2 minutes)

```bash
# Clone and install dependencies
git clone https://github.com/yourusername/engram-simulation-benchmark.git
cd engram-simulation-benchmark
npm install

# Verify installation
npm list | head -20
```

## 3. Run First Benchmark (2 minutes)

### Option A: No Configuration Needed (Recommended for First Run)

```bash
# Run Bitcoin finality simulation (no external dependencies)
node bench/simulation_stage4.js
```

**Expected Output:**
```
🚀 STARTING SECTION 3.5 RETRIEVAL EVALUATION...
🧪 Scenario: 0. Baseline (Happy Path)
✅ Retrieval Success Rate   : 100.00%
✅ Avg Retrieval Latency    : 85 ms
```

### Option B: With RPC Endpoints (Requires Network Access)

```bash
# Run network analysis (requires ENGRAM RPC connection)
node bench/irys_analytics.js
```

## 4. Check Results

```bash
# View output from simulation
node bench/simulation_stage4.js 2>&1 | tail -20
```

## Next Steps

### To Run All Benchmarks

```bash
# Sequential execution
node bench/benchmark.js
node bench/irys_analytics.js
node bench/simulation_stage4.js
node simulation/retrieval_simulation.js
```

### To Use Blockchain Networks

Create `.env` file:

```bash
cp .env.example .env
# Edit .env with your RPC endpoints and credentials
cat .env
```

Then run blockchain benchmarks:

```bash
node bench/irys_benchmark.js
```

### To Run Local Storage Provider

In a separate terminal:

```bash
node simulation/node_provider_b.js
```

Then test with:

```bash
curl -X POST http://localhost:9000/blocks/695290 \
  -H "Content-Type: application/json" \
  -d '{"height":695290,"data":"test"}'

curl http://localhost:9000/blocks/695290
```

## Common Commands

```bash
# List all dependencies
npm list

# Check for updates
npm outdated

# Run specific benchmark
node bench/simulation_stage4.js

# Run with debug output
DEBUG=* node bench/benchmark.js

# Run with increased memory (for large simulations)
NODE_OPTIONS="--max-old-space-size=4096" node simulation/retrieval_simulation.js
```

## Troubleshooting

**Module not found error:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Connection refused:**
```bash
# Check RPC endpoint is accessible
curl http://131.153.224.169:26757/status
```

**Out of memory:**
```bash
NODE_OPTIONS="--max-old-space-size=8192" node <benchmark>
```

## What Each Benchmark Does

| Command | Purpose | Runtime | Requirements |
|---------|---------|---------|--------------|
| `node bench/simulation_stage4.js` | Bitcoin finality latency simulation | 5 sec | None |
| `node bench/irys_analytics.js` | Network parameter analysis | 10 sec | ENGRAM RPC |
| `node bench/benchmark.js` | Babylon anchoring latency | 5+ min | ENGRAM RPC, BABYLON RPC |
| `node bench/irys_benchmark.js` | Irys archival latency | 10+ min | Private key, Babylon mnemonic |
| `node simulation/retrieval_simulation.js` | Retrieval under failures | 1 min | None |

## Project Structure Reference

```
bench/               → Benchmark modules (main experiments)
simulation/          → Simulation modules (helper experiments)
.env.example         → Configuration template
package.json         → Dependencies
README.md           → Full documentation
LICENSE             → MIT License
```

## Need Help?

- 📖 Read [README.md](README.md) for detailed documentation
- 🤝 Check [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- 🐛 Report issues with reproduction steps
- 💬 Ask questions in discussions

## Performance Tips

- Run simulations at off-peak hours (lower network congestion)
- Use 1,000+ iterations for statistical significance
- Monitor system resources: `top` or `Activity Monitor`
- Log results with timestamps for trend analysis

---

**You're all set! Happy benchmarking! 🚀**
