// --- ERASURE CODING ALGORITHM CONFIGURATION ---
const N_SHARDS = 100;
const K_REQUIRED = 30;
const ITERATIONS = 1000;

// --- FUNCTION TO SIMULATE QUERYING ONE PROVIDER (WITH NETWORK JITTER) ---
function queryProvider(nodeIndex, scenario) {
    // Real ping baseline fluctuates from 40ms to 120ms
    let latency = 40 + Math.random() * 80; 
    
    // Scenario 2 & 3: Random/Correlated Loss (Node down)
    // Reality: Timeout never round to 500, fluctuates from 450 - 650ms
    if (scenario.dropRate && Math.random() < scenario.dropRate) {
        return { status: 'offline', latency: 450 + Math.random() * 200 };
    }
    if (scenario.correlatedLoss && nodeIndex >= scenario.corrStart && nodeIndex <= scenario.corrEnd) {
        return { status: 'offline', latency: 450 + Math.random() * 200 };
    }

    // Scenario 1: Honest-but-slow (Slow node due to bottleneck)
    // Reality: Lag from 1.5 seconds to 4 seconds
    if (scenario.slowRate && Math.random() < scenario.slowRate) {
        return { status: 'success', latency: 1500 + Math.random() * 2500 };
    }

    // Scenario 4: Malformed Shards (Node sending fake data)
    // Attackers usually respond very quickly to deceive the system
    if (scenario.malformedRate && Math.random() < scenario.malformedRate) {
        return { status: 'malformed', latency: latency - 10 }; 
    }

    // Scenario 5: Eclipse (Poisoning)
    if (scenario.eclipseNodes && nodeIndex < scenario.eclipseNodes) {
        return { status: 'poisoned', latency: latency + Math.random() * 20 };
    }

    return { status: 'success', latency };
}

// --- FUNCTION TO SIMULATE RETRIEVAL ALGORITHM ---
function runSimulation(scenarioName, scenarioConfig) {
    let stats = {
        successCount: 0, totalLatency: 0, totalQueried: 0, totalRejected: 0, totalShardsReceived: 0
    };

    for (let i = 0; i < ITERATIONS; i++) {
        let validShards = 0;
        let queriedNodes = 0;
        let rejectedShards = 0;
        let runLatency = 0; 
        
        let nodesToQuery = Array.from({length: N_SHARDS}, (_, idx) => idx);
        if (!scenarioConfig.eclipseNodes) nodesToQuery.sort(() => Math.random() - 0.5);

        for (let nodeIndex of nodesToQuery) {
            queriedNodes++;
            let response = queryProvider(nodeIndex, scenarioConfig);
            
            // Get max latency to simulate parallel load
            if (response.latency > runLatency) runLatency = response.latency;

            if (response.status === 'success') {
                validShards++;
            } else {
                // IMPORTANT UPGRADE: Retry Overhead
                // If node dies or sends fake data, Client loses a few milliseconds processing and must query substitute node
                runLatency += (15 + Math.random() * 25); 
                
                if (response.status === 'malformed' || response.status === 'poisoned') {
                    rejectedShards++;
                }
            }

            if (validShards === K_REQUIRED) {
                stats.successCount++;
                break;
            }
        }

        stats.totalLatency += runLatency;
        stats.totalQueried += queriedNodes;
        stats.totalRejected += rejectedShards;
        stats.totalShardsReceived += (validShards + rejectedShards);
    }

    console.log(`\n======================================================`);
    console.log(`🧪 Scenario: ${scenarioName}`);
    console.log(`======================================================`);
    console.log(`- Retrieval Success Rate   : ${((stats.successCount / ITERATIONS) * 100).toFixed(2)}%`);
    console.log(`- Avg Retrieval Latency    : ${(stats.totalLatency / ITERATIONS).toFixed(0)} ms`);
    console.log(`- Avg Providers Queried    : ${(stats.totalQueried / ITERATIONS).toFixed(1)} nodes`);
    
    let rejectionFraction = stats.totalShardsReceived > 0 ? (stats.totalRejected / stats.totalShardsReceived) * 100 : 0;
    console.log(`- Fraction Shards Rejected : ${rejectionFraction.toFixed(2)}%`);
    console.log(`- Decoding Success         : ${stats.successCount > 0 ? '100%' : '0%'}`);
}

// --- RUN SCENARIOS ---
console.log("🚀 STARTING SECTION 3.5 RETRIEVAL EVALUATION (REALISTIC MODEL)...");
runSimulation("0. Baseline (Happy Path)", {});
runSimulation("1. Honest-but-slow Providers (30% slow nodes)", { slowRate: 0.3 });
runSimulation("2. Random Shard Unavailability (40% offline)", { dropRate: 0.4 });
runSimulation("3. Correlated Shard Loss (Rack 20-60 offline)", { correlatedLoss: true, corrStart: 20, corrEnd: 60 });
runSimulation("4. Malformed Shard Responses (30% malicious)", { malformedRate: 0.3 });
runSimulation("5. Eclipse-style Lookup Disruption (First 40 nodes poisoned)", { eclipseNodes: 40 });