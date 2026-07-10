require('dotenv').config();
const axios = require('axios');
const Irys = require("@irys/sdk");
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const DAL_RPC = process.env.DAL_RPC || "http://<your-node>:26757";
const IRYS_NODE = "https://devnet.irys.xyz"; 
const TOKEN_CURRENCY = "ethereum";           
const PROVIDER_URL = "https://1rpc.io/sepolia"; 

const STATE_FILE = './state.json'; 
const HISTORY_JSON = './anchorDepin/archiver.json';
const MAX_ITERATIONS = 10;

// --- STORE METRICS ---
const metrics = {
    uploadLatency: [],     
    retrievalLatency: [],  
    totalDepinLatency: []  
};

function getPercentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return (sorted[index] / 1000).toFixed(2);
}

function printIrysStats() {
    console.log(`\n======================================================================`);
    console.log(`📊 DEPIN LATENCY STATISTICS TABLE (IRYS) - Sample size: ${metrics.uploadLatency.length} Blocks`);
    console.log(`======================================================================`);
    console.log(`| Stage                      | p50 (Med) | p95       | p99       |`);
    console.log(`|----------------------------|-----------|-----------|-----------|`);
    console.log(`| 5. Upload to Irys (s)      | ${getPercentile(metrics.uploadLatency, 50).padEnd(9)} | ${getPercentile(metrics.uploadLatency, 95).padEnd(9)} | ${getPercentile(metrics.uploadLatency, 99).padEnd(9)} |`);
    console.log(`| 6. Wait for Gateway 200(s) | ${getPercentile(metrics.retrievalLatency, 50).padEnd(9)} | ${getPercentile(metrics.retrievalLatency, 95).padEnd(9)} | ${getPercentile(metrics.retrievalLatency, 99).padEnd(9)} |`);
    console.log(`| Total DePIN Time (s)       | ${getPercentile(metrics.totalDepinLatency, 50).padEnd(9)} | ${getPercentile(metrics.totalDepinLatency, 95).padEnd(9)} | ${getPercentile(metrics.totalDepinLatency, 99).padEnd(9)} |`);
    console.log(`======================================================================\n`);
}

async function getIrys() {
    if (!process.env.PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY in .env");
    const irys = new Irys({
        network: "devnet",
        token: TOKEN_CURRENCY,
        key: process.env.PRIVATE_KEY,
        config: { providerUrl: PROVIDER_URL }
    });
    await irys.ready(); 
    return irys;
}

// =========================================================================
// FUNCTION 2 (ALREADY FIXED): DECODE DATA FROM CELESTIA TRANSACTION
// =========================================================================
function decodeDePINData(txBase64) {
    try {
        // 1. Decode from Base64 to UTF-8 string (this string may contain Protobuf garbage characters)
        const rawString = Buffer.from(txBase64, 'base64').toString('utf-8');
        
        // 2. Use smart Regex to find the core JSON part.
        // Logic: Find segment starting with {"_id" or {"id" or [{"_id" and ending with } or }]
        // Specifically per your pattern, DePIN data contains `{"_id":"...`
        const jsonMatch = rawString.match(/(\[\{.*?\}\]|\{".*?_id.*?\})/);
        
        if (jsonMatch) {
            // Filter out garbage characters (if any) stuck at end of string
            let cleanStr = jsonMatch[0];
            const lastBraceIndex = cleanStr.lastIndexOf('}');
            const lastBracketIndex = cleanStr.lastIndexOf(']');
            const cutIndex = Math.max(lastBraceIndex, lastBracketIndex);
            
            if (cutIndex !== -1) {
                cleanStr = cleanStr.substring(0, cutIndex + 1);
                return JSON.parse(cleanStr); 
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

function appendToJSONHistory(entry) {
    let history = [];
    try {
        const dir = path.dirname(HISTORY_JSON);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (fs.existsSync(HISTORY_JSON)) {
            const fileContent = fs.readFileSync(HISTORY_JSON, 'utf-8');
            history = JSON.parse(fileContent);
        }
    } catch (e) {
        console.error("⚠️ Error reading history JSON file, reinitializing...");
    }
    history.push({ timestamp: new Date().toISOString(), ...entry });
    fs.writeFileSync(HISTORY_JSON, JSON.stringify(history, null, 2));
}

async function fetchBlock(height) {
    try {
        const url = `${DAL_RPC}/block?height=${height}`;
        const res = await axios.get(url, { timeout: 5000 });
        if (res.data && res.data.result && res.data.result.block) return res.data.result; 
        return null;
    } catch (e) { return null; }
}

async function waitForRetrieval(receiptId) {
    const gatewayUrl = `https://gateway.irys.xyz/${receiptId}`;
    const startTime = Date.now();
    
    process.stdout.write(`   ⏳ Waiting for Gateway to sync... `);
    while (true) {
        try {
            const res = await axios.head(gatewayUrl, { timeout: 3000 });
            if (res.status === 200 || res.status === 202) {
                const latency = Date.now() - startTime;
                console.log(`✅ OK! (${(latency/1000).toFixed(2)}s)`);
                return latency;
            }
        } catch (e) {
            // Waiting for gateway to index
        }
        await new Promise(r => setTimeout(r, 2000));
    }
}

function getLastHeight() {
    if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE)).lastHeight;
    }
    return 1;
}

function saveHeight(height) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ lastHeight: height }));
}

async function main() {
    console.log(`🚀 STARTING JSON ARCHIVER & DEPIN BENCHMARK (Measuring ${MAX_ITERATIONS} blocks with data)...`);
    
    let irys;
    try {
        irys = await getIrys();
        console.log(`🟢 Connected to Irys Devnet. Wallet: ${irys.address}`);
    } catch (e) {
        console.error("❌ Irys connection error:", e.message);
        return;
    }

    let currentHeight = getLastHeight();
    let iterations = 0;

    while (true) {
        const blockData = await fetchBlock(currentHeight);

        if (blockData) {
            const blockHash = blockData.block_id.hash;
            const txs = blockData.block.data.txs || [];
            
            try {
                // Decode data (Using new smart regex function)
                const decodedPayloads = txs.map(tx => decodeDePINData(tx)).filter(d => d !== null);

                if (decodedPayloads.length > 0) {
                    console.log(`\n📦 Block #${currentHeight} has ${decodedPayloads.length} DePIN Txs. Starting Anchor...`);
                    
                    const payload = {
                        chain: "engram",
                        height: currentHeight,
                        block_hash: blockHash,
                        block_data: blockData, 
                        depin_records: decodedPayloads
                    };

                    const payloadString = JSON.stringify(payload);
                    const size = Buffer.byteLength(payloadString, 'utf8');
                    const price = await irys.getPrice(size);
                    const balance = await irys.getLoadedBalance();

                    if (balance.lt(price)) {
                        console.log(`   💸 Adding more fees to Irys...`);
                        await irys.fund(price); 
                    }
                    
                    const startUpload = Date.now();
                    const receipt = await irys.upload(payloadString, {
                        tags: [
                            { name: "Content-Type", value: "application/json" },
                            { name: "Block-Height", value: currentHeight.toString() }
                        ]
                    });
                    const uploadTime = Date.now() - startUpload;
                    metrics.uploadLatency.push(uploadTime);

                    console.log(`   ✅ Archived ID: ${receipt.id} | Upload Time: ${(uploadTime/1000).toFixed(2)}s`);
                    
                    const retrievalTime = await waitForRetrieval(receipt.id);
                    metrics.retrievalLatency.push(retrievalTime);
                    metrics.totalDepinLatency.push(uploadTime + retrievalTime);

                    appendToJSONHistory({
                        height: currentHeight,
                        block_hash: blockHash,
                        irys_id: receipt.id,
                        gateway_url: `https://gateway.irys.xyz/${receipt.id}`,
                        tx_count: txs.length,
                        depin_data: decodedPayloads
                    });
                    
                    iterations++; 

                } else {
                    process.stdout.write(`\r⏩ Block #${currentHeight} has no DePIN, skipping...        `);
                }

                saveHeight(currentHeight);
                currentHeight++;

                if (iterations >= MAX_ITERATIONS) {
                    printIrysStats();
                    process.exit(0);
                }

            } catch (err) {
                console.error(`\n❌ Error at #${currentHeight}: ${err.message}`);
                await new Promise(r => setTimeout(r, 2000));
            }
        } else {
            process.stdout.write(`\r⏳ Waiting for Block #${currentHeight} from DAL...        `);
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

main();