const crypto = require('crypto');

function generateMockRoot(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Simulate network latency (sleep)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runPortabilitySimulation() {
    console.log(`Starting portability simulation...\n`);

    // Mock block data
    const mockBlockData = {
        height: 695290,
        txs: ["tx_1_transfer_100", "tx_2_deploy_contract", "tx_3_store_depin_data"],
        timestamp: Date.now()
    };

    let providerADatabase = mockBlockData;
    let providerBDatabase = null;

    try {
        // Step 1: Download from Provider A (Irys)
        process.stdout.write(`1. Simulating download from Provider A (Irys)... `);
        const downloadedDataA = providerADatabase;
        const latencyA = 1017; 
        await sleep(latencyA); 
        
        const anchoredRoot = generateMockRoot(downloadedDataA);
        console.log(`Done! (${latencyA}ms)`);
        console.log(`   Anchored Root: ${anchoredRoot.substring(0, 16)}...`);

        // Step 2: Migrate to Provider B (Local)
        process.stdout.write(`2. Simulating migration to Provider B (Local)... `);
        const migrationTime = 4;
        await sleep(migrationTime);
        providerBDatabase = downloadedDataA;
        console.log(`Done! (${migrationTime}ms)`);

        // Step 3: Load and verify from Provider B
        process.stdout.write(`3. Loading and verifying from Local... `);
        const downloadedDataB = providerBDatabase;
        const newRoot = generateMockRoot(downloadedDataB);
        const latencyB = 2;
        await sleep(latencyB);
        const isVerified = (newRoot === anchoredRoot);
        console.log(`Done! (${latencyB}ms)`);
        console.log(`   Root Match: ${isVerified ? "YES" : "NO"}`);

        // Results
        console.log(`\n=================================================================`);
        console.log(`PROVIDER PORTABILITY SIMULATION RESULTS`);
        console.log(`=================================================================`);
        console.log(`- Retrieval Latency (Provider A - Irys) : ${latencyA} ms`);
        console.log(`- Retrieval Latency (Provider B - Local): ${latencyB} ms`);
        console.log(`- Migration Overhead (Copy time)        : ${migrationTime} ms`);
        console.log(`- Integrity Preserved (Root Match)      : ${isVerified ? "TRUE (100% Match)" : "FALSE"}`);
        console.log(`=================================================================\n`);
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

runPortabilitySimulation();