// --- SIMULATION EXPERIMENT: BITCOIN FINALITY LATENCY (STAGE 4) ---

const MOCK_ITERATIONS = 10000; // Simulate 10,000 send attempts
const BTC_BLOCK_MEAN_SEC = 600; // Average 1 BTC block = 10 minutes
const BTC_CONFIRMATIONS = 6;    // Require 6 blocks for Finality
const BABYLON_EPOCH_MAX_SEC = 3600; // Maximum assumed Babylon epoch is 1 hour

// Function to generate random numbers with exponential distribution
// Accurately simulate block mining time of Proof-of-Work network
function getBtcBlockTime() {
    return -Math.log(1.0 - Math.random()) * BTC_BLOCK_MEAN_SEC;
}

const latencies = [];

for (let i = 0; i < MOCK_ITERATIONS; i++) {
    // 1. Time to wait for Babylon epoch to close (Uniform distribution from 0 to Max)
    const babylonWait = Math.random() * BABYLON_EPOCH_MAX_SEC;

    // 2. Time to wait for 6 Bitcoin Blocks (Sum of 6 exponentially distributed random variables)
    let btcConfirmWait = 0;
    for (let b = 0; b < BTC_CONFIRMATIONS; b++) {
        btcConfirmWait += getBtcBlockTime();
    }

    // Total latency for Stage 4
    latencies.push(babylonWait + btcConfirmWait);
}

// --- CALCULATION AND TABLE DISPLAY ---
latencies.sort((a, b) => a - b);

function getPercentile(arr, p) {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[index];
}

// Convert seconds to Hour:Minute:Second format for easy reading
function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h}h ${m}m ${s}s`;
}

console.log(`\n=============================================================================`);
console.log(`📊 LATENCY SIMULATION STATISTICS TABLE - STAGE 4 (BITCOIN FINALITY)`);
console.log(`=============================================================================`);
console.log(`Simulation sample size (N) : ${MOCK_ITERATIONS.toLocaleString()} epochs`);
console.log(`Network configuration   : Babylon Epoch ~1h | Require ${BTC_CONFIRMATIONS} BTC Confirmations`);
console.log(`-----------------------------------------------------------------------------`);
console.log(`🎯 p50 (Median)     : ${formatTime(getPercentile(latencies, 50))} `);
console.log(`🔥 p95 (95%)       : ${formatTime(getPercentile(latencies, 95))} `);
console.log(`🚨 p99 (99%)       : ${formatTime(getPercentile(latencies, 99))} `);
console.log(`=============================================================================\n`);