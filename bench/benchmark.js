require('dotenv').config();
const axios = require('axios');
const { MerkleTree } = require('merkletreejs');
const SHA256 = require('crypto-js/sha256');

const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { SigningStargateClient, assertIsDeliverTxSuccess } = require("@cosmjs/stargate");

const winston = require('winston');
const path = require('path');

const ENGRAM_RPC = process.env.ENGRAM_RPC || "http://131.153.224.169:26757";
const BABYLON_RPC = "https://babylon-testnet-rpc.nodes.guru"; 
const BABYLON_DENOM = "ubbn";
const BATCH_SIZE = 10; 


const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${message}`)
    ),
    transports: [new winston.transports.Console()]
});

const MNEMONIC = process.env.BABYLON_MNEMONIC ? process.env.BABYLON_MNEMONIC.trim() : "";

const metrics = {
    babylonLatency: []
};

function getPercentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return (sorted[index] / 1000).toFixed(2);
}

function printLatencyTable() {
    console.log(`\n========================================================================================`);
    console.log(`📊 LATENCY STATISTICS TABLE (BABYLON) - Sample size: ${metrics.babylonLatency.length} Batches`);
    console.log(`========================================================================================`);
    console.log(`| Stage                                              | p50 (Med) | p95       | p99       |`);
    console.log(`|----------------------------------------------------|-----------|-----------|-----------|`);
    console.log(`| 3. Pub Verified -> Checkpoint Formed (Babylon)     | ${getPercentile(metrics.babylonLatency, 50).padEnd(9)} | ${getPercentile(metrics.babylonLatency, 95).padEnd(9)} | ${getPercentile(metrics.babylonLatency, 99).padEnd(9)} |`);
    console.log(`========================================================================================`);
    console.log(`* Note: Time calculated from when the first block of the batch starts being collected until the TxHash appears on Babylon.\n`);
}

async function getENGRAMBlock() {
    try {
        const res = await axios.get(`${ENGRAM_RPC}/status`);
        const info = res.data.result.sync_info;
        return {
            height: parseInt(info.latest_block_height),
            hash: info.latest_block_hash,
            fetchTime: Date.now()
        };
    } catch (e) {
        return null;
    }
}

async function submitToBabylon(memoData) {
    try {
        if (!MNEMONIC) return { txHash: "mock_hash_for_test", gasUsed: 100000 };

        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, { prefix: "bbn" });
        const [account] = await wallet.getAccounts();
        const client = await SigningStargateClient.connectWithSigner(BABYLON_RPC, wallet);

        const feeConfig = { amount: [{ denom: BABYLON_DENOM, amount: "500" }], gas: "250000" };
        
        const result = await client.sendTokens(account.address, account.address, [{ denom: BABYLON_DENOM, amount: "1" }], feeConfig, memoData);
        assertIsDeliverTxSuccess(result);
        return { txHash: result.transactionHash, gasUsed: result.gasUsed };
    } catch (error) {
        logger.error(`❌ Babylon Error: ${error.message}`);
        return null;
    }
}

async function anchorBatch(batch) {
    const startHeight = batch[0].height;
    const endHeight = batch[batch.length - 1].height;
    
    const timeSinceFirstBlock = Date.now() - batch[0].fetchTime; 

    const leaves = batch.map(b => SHA256(b.hash));
    const tree = new MerkleTree(leaves, SHA256);
    const root = tree.getRoot().toString('hex');

    const txStartTime = Date.now();
    const txResult = await submitToBabylon(`ENGRAM:${startHeight}:${endHeight}:${root}`);
    const txConfirmTime = Date.now() - txStartTime;

    if (txResult) {
        logger.info(`✅ BATCH ${startHeight}-${endHeight} ANCHORED! Babylon Tx: ${txResult.txHash}`);
        
        const totalStage3Latency = timeSinceFirstBlock + txConfirmTime;
        metrics.babylonLatency.push(totalStage3Latency);

        printLatencyTable();
        return true;
    }
    return false;
}

async function main() {
    let lastProcessedHeight = 0;
    let batchBuffer = []; 

    logger.info("⏳ Listening for new blocks from ENGRAM (Babylon Benchmark Mode)...");

    while (true) {
        const block = await getENGRAMBlock();

        if (block && block.height > lastProcessedHeight) {
            const exists = batchBuffer.find(b => b.height === block.height);
            if (!exists) {
                batchBuffer.push(block);
                process.stdout.write(`\r📥 Collecting Block ${block.height} (${batchBuffer.length}/${BATCH_SIZE})`);
                lastProcessedHeight = block.height;

                if (batchBuffer.length >= BATCH_SIZE) {
                    console.log();
                    const success = await anchorBatch(batchBuffer);
                    if (success) batchBuffer = []; 
                }
            }
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}

main();