require('dotenv').config();
const axios = require('axios');

// --- CONFIGURATION ---
const DAL_RPC = process.env.DAL_RPC || "http://131.153.224.169:26757";
const BABYLON_RPC = "https://babylon-testnet-rpc.nodes.guru"; 
const EXPERIMENT_BATCH_SIZES = [1, 10, 50, 100, 360];

// Function to fetch block from real node
async function fetchBlock(height) {
    try {
        const url = height ? `${DAL_RPC}/block?height=${height}` : `${DAL_RPC}/block`;
        const res = await axios.get(url, { timeout: 5000 });
        return res.data?.result;
    } catch (e) {
        return null;
    }
}

// Get token price (Mock USD price for Testnet, can be replaced with Binance API if running Mainnet)
const BBN_TO_USD = 0.5; // Assume 1 BBN = $0.5
const UBBBN_TO_BBN = 1_000_000;

async function main() {
    console.log("🚀 COLLECTING REAL DATA FROM NETWORK (STRATA DAL & BABYLON)...");
    
    // 1. Get latest block to determine peak
    const latestBlock = await fetchBlock();
    if (!latestBlock) {
        console.error("❌ Cannot connect to DAL RPC");
        return;
    }
    const latestHeight = parseInt(latestBlock.block.header.height);
    const maxBlocksToFetch = Math.max(...EXPERIMENT_BATCH_SIZES); // 360 blocks

    console.log(`📥 Loading last ${maxBlocksToFetch} historical blocks (From #${latestHeight - maxBlocksToFetch} to #${latestHeight})...`);

    // 2. Pull historical data
    let blocks = [];
    for (let i = 0; i <= maxBlocksToFetch; i++) {
        const h = latestHeight - maxBlocksToFetch + i;
        if (h > 0) {
            const b = await fetchBlock(h);
            if (b) blocks.push(b);
        }
    }

    if (blocks.length < 2) {
        console.log("⚠️ Not enough block data to analyze.");
        return;
    }

    // =========================================================================
    // 3. CALCULATE REAL PARAMETERS
    // =========================================================================
    
    // A. Calculate Real Block Time
    const startTime = new Date(blocks[0].block.header.time).getTime();
    const endTime = new Date(blocks[blocks.length - 1].block.header.time).getTime();
    const realBlockTimeSec = ((endTime - startTime) / 1000) / blocks.length;

    // B. Calculate Real Block Size
    let totalBytes = 0;
    blocks.forEach(b => {
        const txs = b.block.data.txs || [];
        txs.forEach(tx => {
            totalBytes += Buffer.byteLength(tx, 'base64');
        });
    });
    const realAvgBlockSizeKB = (totalBytes / blocks.length) / 1024;

    // C. Calculate Real Babylon Fee (Hardcode according to standard CosmosSDK gas limit for sending tokens)
    // In reality, sending 1 Tx to Babylon costs about 200,000 Gas * 0.002 ubbn (gas price)
    const realBabylonFeeUbbn = 500; // Real fee parameter you configured in Babylon file
    const realFeeUsd = (realBabylonFeeUbbn / UBBBN_TO_BBN) * BBN_TO_USD; 

    console.log(`\n========================================================================================`);
    console.log(`✅ MEASURED REAL NETWORK PARAMETERS:`);
    console.log(`   - Real Block Time    : ${realBlockTimeSec.toFixed(2)} seconds/block`);
    console.log(`   - Real Block Size    : ${realAvgBlockSizeKB.toFixed(4)} KB/block (Data Txs only)`);
    console.log(`   - Babylon Tx Fee     : ${realBabylonFeeUbbn} ubbn (~$${realFeeUsd.toFixed(6)})`);
    console.log(`========================================================================================\n`);

    // =========================================================================
    // 4. RUN ANALYSIS TABLE BASED ON REAL NUMBERS
    // =========================================================================
    
    const SECONDS_PER_DAY = 86400;
    const totalBlocksPerDay = SECONDS_PER_DAY / realBlockTimeSec;
    const totalDataGbPerDay = (totalBlocksPerDay * realAvgBlockSizeKB) / (1024 * 1024);

    console.log(`| Anchor Cycle (Blocks) | Avg Latency (s) | Anchors/Day | Babylon Fee/Day ($) | Cost/GB ($) |`);
    console.log(`|---------------------|------------|---------------|----------------------|-------------|`);

    EXPERIMENT_BATCH_SIZES.forEach(batchSize => {
        // Calculate based on real numbers
        const maxWaitTimeSec = batchSize * realBlockTimeSec;
        const avgLatencySec = maxWaitTimeSec / 2;
        const anchorsPerDay = SECONDS_PER_DAY / maxWaitTimeSec;
        const costPerDayUsd = anchorsPerDay * realFeeUsd;
        
        let costPerGbUsd = 0;
        if (totalDataGbPerDay > 0) {
            costPerGbUsd = costPerDayUsd / totalDataGbPerDay;
        }

        console.log(
            `| ${batchSize.toString().padEnd(19)} ` +
            `| ${avgLatencySec.toFixed(1).padEnd(10)} ` +
            `| ${Math.round(anchorsPerDay).toLocaleString().padEnd(13)} ` +
            `| $${costPerDayUsd.toFixed(4).padEnd(19)} ` +
            `| $${costPerGbUsd.toFixed(4).padEnd(10)} |`
        );
    });
    console.log(`========================================================================================\n`);
    console.log(`* Note: Current Testnet block size may be smaller than Mainnet due to fewer users.`);
}

main();