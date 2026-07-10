# ENGRAM Simulation Benchmark

A comprehensive benchmarking suite for testing data availability and finality latency across multiple blockchain protocols and storage networks.

## Overview

This project simulates and measures end-to-end latency for data anchoring across:
- **Babylon**: BTC finality layer
- **Irys**: Decentralized storage network
- **ENGRAM**: Data availability network
- **Erasure Coding**: Retrieval optimization algorithms

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [How to Run](#how-to-run)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [License](#license)

---

## Prerequisites

### Required

- **Node.js**: v18.0.0 or higher
  - Download: https://nodejs.org/
  - Verify: `node --version && npm --version`

- **npm**: v9.0.0 or higher (comes with Node.js)

### Optional

- **Python**: v3.8 or higher (for standalone utility scripts)
  - Download: https://www.python.org/
  - Verify: `python3 --version`

- **Docker**: v20.0 or higher (for isolated execution)
  - Download: https://www.docker.com/
  - Verify: `docker --version`

### Environment Variables

Create a `.env` file in the root directory (optional):

```env
# RPC Endpoints
ENGRAM_RPC=http://<your-node>:26757
BABYLON_RPC=https://babylon-testnet-rpc.nodes.guru
DAL_RPC=http://<your-node>:26757

# Network Configuration
BATCH_SIZE=10
BABYLON_DENOM=ubbn

# Ethereum/Sepolia Configuration (for Irys)
PRIVATE_KEY=your_ethereum_private_key
BABYLON_MNEMONIC=your_babylon_mnemonic_seed_phrase
```

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/engram-simulation-benchmark.git
cd engram-simulation-benchmark
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

This installs all required packages:
- `@cosmjs/*` - Cosmos SDK client libraries
- `@irys/sdk` - Irys storage integration
- `axios` - HTTP client
- `express` - Web server framework
- `merkletreejs` - Merkle tree operations
- `crypto-js` - Cryptographic functions
- `bitcoinjs-lib` - Bitcoin utilities
- `ethers` - Ethereum integration
- `winston` - Logging framework
- And additional dependencies

### Step 3: Verify Installation

```bash
npm list
node -v
```

---

## How to Run

### Benchmark Modules

#### 1. **Babylon Benchmark** (Stage 3: Anchoring Latency)
Measures end-to-end latency from block collection to Babylon finality.

```bash
node bench/benchmark.js
```

**Expected Output:**
- Real-time block collection (📥 Collecting Block...)
- Babylon anchoring confirmation (✅ BATCH ... ANCHORED!)
- Latency statistics (p50, p95, p99)

---

#### 2. **Irys Analytics** (Real Network Parameters)
Analyzes current network conditions and calculates anchoring cost per GB.

```bash
node bench/irys_analytics.js
```

**Output Includes:**
- Block time measurements (seconds/block)
- Block size analysis (KB/block)
- Babylon fee estimation
- Cost breakdown table

---

#### 3. **Irys Benchmark** (JSON Archival + DePIN Latency)
Archives blocks to Irys and measures retrieval latency from gateway.

```bash
node bench/irys_benchmark.js
```

**Requirements:**
- `.env` file with `PRIVATE_KEY` (Ethereum) and `BABYLON_MNEMONIC`
- Irys account funded with testnet ETH

**Output:**
- Upload latency to Irys (s)
- Gateway synchronization time (s)
- Total DePIN latency (s)

---

#### 4. **Bitcoin Finality Simulation** (Stage 4)
Simulates finality latency with 6-block Bitcoin confirmation + Babylon epoch.

```bash
node bench/simulation_stage4.js
```

**Output:**
- Latency distribution (p50, p95, p99)
- Time format: H:M:S for readability
- 10,000 simulation iterations

---

### Simulation Modules

#### 1. **Provider Portability Test**
Tests data migration between storage providers with integrity verification.

```bash
node simulation/migrate.js
```

---

#### 2. **Data Migration Test**
Tests data transfer from Irys gateway to local Server 2.

```bash
node simulation/migrate_simulation.js
```

---

#### 3. **Retrieval Evaluation** (Section 3.5)
Simulates retrieval under various failure scenarios:
- Honest-but-slow providers (30% slow)
- Random shard unavailability (40% offline)
- Correlated shard loss (rack failure)
- Malformed responses (30% Byzantine)
- Eclipse-style poisoning

```bash
node simulation/retrieval_simulation.js
```

---

#### 4. **Local Storage Provider**
Starts a local HTTP server for Provider B (local block storage).

```bash
node simulation/node_provider_b.js
```

**Server Info:**
- **Port**: 9000
- **Address**: 0.0.0.0:9000
- **Endpoints**:
  - `POST /blocks/:height` - Store block
  - `GET /blocks/:height` - Retrieve block

---

### Run All Benchmarks (Sequential)

```bash
# Create a benchmark runner script
cat > run_all_benchmarks.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting all benchmarks..."

echo "1️⃣  Babylon Benchmark"
node bench/benchmark.js

echo ""
echo "2️⃣  Irys Analytics"
node bench/irys_analytics.js

echo ""
echo "3️⃣  Bitcoin Finality Simulation"
node bench/simulation_stage4.js

echo ""
echo "4️⃣  Retrieval Evaluation"
node simulation/retrieval_simulation.js

echo "✅ All benchmarks complete!"
EOF

chmod +x run_all_benchmarks.sh
./run_all_benchmarks.sh
```

---

## Project Structure

```
engram-simulation-benchmark/
├── bench/                          # Benchmark modules
│   ├── benchmark.js               # Babylon latency measurement
│   ├── irys_analytics.js          # Network parameter analysis
│   ├── irys_benchmark.js          # Irys archival + DePIN latency
│   └── simulation_stage4.js        # Bitcoin finality simulation
├── simulation/                      # Simulation modules
│   ├── migrate.js                 # Provider portability test
│   ├── migrate_simulation.js       # Data migration test
│   ├── retrieval_simulation.js     # Retrieval under failure scenarios
│   ├── node_provider_b.js          # Local storage provider server
│   └── local_blocks/              # Local block storage directory
├── package.json                    # Node.js dependencies
├── README.md                       # This file
├── LICENSE                         # MIT License
└── .env.example                    # Environment variables template
```

---

## Configuration

### Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `ENGRAM_RPC` | `http://<your-node>:26757` | ENGRAM node RPC endpoint |
| `BABYLON_RPC` | `https://babylon-testnet-rpc.nodes.guru` | Babylon testnet RPC |
| `DAL_RPC` | `http://<your-node>:26757` | DAL/STRATA RPC endpoint |
| `BATCH_SIZE` | `10` | Block batch size for anchoring |
| `BABYLON_DENOM` | `ubbn` | Babylon denomination (micro-BBN) |
| `PRIVATE_KEY` | (required for Irys) | Ethereum private key (hex format) |
| `BABYLON_MNEMONIC` | (required for Babylon) | Babylon wallet seed phrase (space-separated) |
| `MAX_ITERATIONS` | `10` | Irys benchmark iterations |

### Create .env File

```bash
cp .env.example .env
# Edit .env with your actual values
```

---

## Output Interpretation

### Latency Metrics (All in seconds)

- **p50 (Median)**: 50th percentile - typical latency
- **p95 (95th percentile)**: 95% of operations complete within this time
- **p99 (99th percentile)**: 99% of operations complete within this time

### Example Output Table

```
========================================================================================
📊 LATENCY STATISTICS TABLE (BABYLON) - Sample size: 5 Batches
========================================================================================
| Stage                                              | p50 (Med) | p95       | p99       |
|----------------------------------------------------|-----------|-----------|-----------|
| 3. Pub Verified -> Checkpoint Formed (Babylon)     | 12.50     | 15.25     | 18.75     |
========================================================================================
```

---

## Troubleshooting

### Connection Errors

```bash
# Test RPC connectivity
curl <your-node>:26757/status

# Or use axios-based checker
node -e "const axios = require('axios'); axios.get('http://<your-node>:26757/status').then(r => console.log('✅ Connected')).catch(e => console.log('❌', e.message))"
```

### Missing Dependencies

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Module Not Found

```bash
# Ensure you're in project root
pwd  # Should end with engram-simulation-benchmark
npm list  # Verify all packages are installed
```

### Out of Memory (for simulations)

```bash
# Increase Node.js heap size
NODE_OPTIONS="--max-old-space-size=4096" node simulation/retrieval_simulation.js
```

---

## Development

### Adding New Benchmarks

1. Create a new file in `bench/` directory
2. Follow naming convention: `{feature}_benchmark.js`
3. Use existing patterns for logging and metrics collection
4. Export functions for integration testing

### Testing Locally

```bash
# Basic syntax check
node -c bench/benchmark.js

# Run with debug output
DEBUG=* node bench/benchmark.js
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-benchmark`)
3. Commit changes (`git commit -m 'Add new latency measurement'`)
4. Push to branch (`git push origin feature/amazing-benchmark`)
5. Open a Pull Request

---

## Performance Tips

- Run benchmarks during off-peak hours for consistent results
- Use multiple iterations for statistical significance
- Monitor system resources during long-running benchmarks
- Store results with timestamps for trend analysis

---

## FAQ

**Q: How often should I run benchmarks?**
A: Weekly for production monitoring, daily for development.

**Q: Can I modify BATCH_SIZE?**
A: Yes, but larger batches reduce anchoring frequency and latency variance.

**Q: What's the minimum data needed?**
A: 360 historical blocks for representative analysis.

**Q: Does it require real blockchain testnet accounts?**
A: Only for Irys benchmarking (requires funded Ethereum account).

---

## Support

- 🐛 Issues: https://github.com/EngramProtocol/engram-simulation-benchmark/issues
- 💬 Discussions: https://github.com/EngramProtocol/engram-simulation-benchmark/discussions

---

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## Changelog

### v1.0.0 (2026-04-20)
- Initial release
- Babylon, Irys, and Bitcoin finality benchmarks
- Retrieval simulation framework
- Real network parameter analysis

---

## Acknowledgments

- Babylon Protocol team
- Irys network
- ENGRAM Data Availability research
- Community testers and contributors

---

**Last Updated**: April 20, 2026  
**Status**: Active Development
