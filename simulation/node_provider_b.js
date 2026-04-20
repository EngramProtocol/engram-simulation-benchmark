const express = require('express');
const fs = require('fs');
const path = require('path'); // ADD THIS LIBRARY
const app = express();
const PORT = 9000;

app.use(express.json({ limit: '50mb' }));

// FIX: Force absolute path to directory containing this code file
const STORAGE_DIR = path.join(__dirname, 'local_blocks'); 
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);

app.post('/blocks/:height', (req, res) => {
    const filePath = path.join(STORAGE_DIR, `${req.params.height}.json`);
    fs.writeFileSync(filePath, JSON.stringify(req.body));
    res.status(200).send('OK');
});

app.get('/blocks/:height', (req, res) => {
    const filePath = path.join(STORAGE_DIR, `${req.params.height}.json`);
    
    if (fs.existsSync(filePath)) {
        // FIX: Since filePath is already an absolute path, pass it directly
        res.sendFile(filePath); 
    } else {
        res.status(404).send('Not found');
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🟢 Provider B waiting for data on port ${PORT}...`));