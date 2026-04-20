const axios = require('axios');

const BLOCK_HEIGHT = "695290";
const IRYS_RECEIPT_ID = "5mrYCJDg1UHEdK2GT7XHXQhbC9tQsyibDUgA6FTDU9BT";
const SERVER2_URL = "http://localhost:9000/blocks";

async function runBasicMigration() {
    console.log(`Starting data migration test for block #${BLOCK_HEIGHT}...\n`);

    try {
        process.stdout.write(`1. Loading from Irys (Provider A)... `);
        let start = Date.now();
        const resA = await axios.get(`https://gateway.irys.xyz/${IRYS_RECEIPT_ID}`);
        const dataA = resA.data;
        const latencyA = Date.now() - start;
        console.log(`Done! (${latencyA}ms)`);

        process.stdout.write(`2. Pushing to Server 2... `);
        await axios.post(`${SERVER2_URL}/${BLOCK_HEIGHT}`, dataA);
        const migrationTime = Date.now() - start;
        console.log(`Done! (${migrationTime}ms)`);

        process.stdout.write(`3. Testing reload from Server 2... `);
        const resB = await axios.get(`${SERVER2_URL}/${BLOCK_HEIGHT}`);
        const latencyB = Date.now() - start;
        console.log(`Done! (${latencyB}ms)`);

        console.log(`\n======================================================`);
        console.log(`MIGRATION TEST RESULTS`);
        console.log(`======================================================`);
        console.log(`- Migration Time (Copy)      : ${migrationTime} ms`);
        console.log(`- Retrieval Latency (Irys)   : ${latencyA} ms`);
        console.log(`- Retrieval Latency (Srv 2)  : ${latencyB} ms`);
        console.log(`======================================================\n`);
        console.log(`Note: Transfer works well. Ready to integrate Verify function`);

    } catch (error) {
        console.error(`\nError: ${error.message}`);
    }
}

runBasicMigration();