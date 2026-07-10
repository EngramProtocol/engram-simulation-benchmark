# Engram Evaluation & Benchmark Suite

The measurement code behind the evaluation in the Engram paper. Each module here produces one of the reported results: staged lifecycle latency, Bitcoin-confirmation modeling, settlement-cost analysis, persistence transfer, adversarial retrieval, and provider portability.

- Paper: *Engram: Bitcoin-Anchored Data Publication and Persistent Decentralized Storage* (under review at ACM TOIT)
- Archived artifacts: [DOI 10.5281/zenodo.19879674](https://doi.org/10.5281/zenodo.19879674)
- Organization: [github.com/EngramProtocol](https://github.com/EngramProtocol)

## What reproduces what

| Module | Command | Paper section / result |
|---|---|---|
| Checkpoint anchoring latency | `node bench/benchmark.js` | §4.3 Stage 3: checkpoint formation via the current settlement path (median ≈ 60 s per 10-block batch) |
| Bitcoin confirmation model | `node bench/simulation_stage4.js` | §4.3 Stage 4: modeled 6-confirmation delay, N = 10,000 samples (median ≈ 1 h 28 m) |
| Workload & anchoring-cost analysis | `node bench/irys_analytics.js` | §4.4: cost–latency amortization inputs (Table 5) |
| Persistence transfer | `node bench/irys_benchmark.js` | §4.3 Stages 5–6: upload + gateway propagation (median ≈ 9.4 s) |
| Adversarial retrieval | `node simulation/retrieval_simulation.js` | §4.8: six scenarios incl. eclipse-style disruption (Table 8) |
| Provider portability | `node simulation/migrate.js`, `node simulation/migrate_simulation.js` | §4.9: governed backend migration (≈ 1.4 s, < 10 ms interruption) |
| Local storage provider | `node simulation/node_provider_b.js` | Helper server (port 9000) used by the migration tests |

Exact section/figure mapping is being finalized alongside the paper's review cycle; open an issue if a number and a module disagree.

## Prerequisites

- Node.js ≥ 18, npm ≥ 9
- Testnet accounts only where noted: the Irys benchmark needs a funded Sepolia key; the anchoring benchmark needs a funded settlement-testnet mnemonic. All other modules run offline or against your own node.

## Setup

```bash
git clone https://github.com/EngramProtocol/engram-simulation-benchmark.git
cd engram-simulation-benchmark
npm install
cp .env.example .env   # fill endpoints and (testnet-only) keys
```

Point `ENGRAM_RPC` / `DAL_RPC` at your own Strata node (the Engram publication-layer node), e.g. `http://<your-node>:26757`. **Never commit a `.env` file, a real key, or a real mnemonic.**

## Output

Latency modules report p50/p95/p99 in seconds and print a summary table per stage. The retrieval simulation reports success rate, average latency, queried-node count, and shard-authentication reject rate per scenario, matching the columns of Table 8 in the paper.

## Support

Bug reports and questions: [GitHub Issues](https://github.com/EngramProtocol/engram-simulation-benchmark/issues).

## License

Apache-2.0. See `LICENSE` and `NOTICE`.
