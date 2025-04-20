const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(bodyParser.json());

// API endpoint to trigger scraping
app.post('/api/scrape', (req, res) => {
  const { query, scrollAmount, locations } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  console.log(`Starting scrape for: ${query}`);
  
  // Launch Python script as a subprocess
  const pythonProcess = spawn('python', [
    'business_scraper.py',
    '--query', query,
    '--scrolls', scrollAmount || '10',
    '--locations', locations ? JSON.stringify(locations) : '[]'
  ]);

  let dataString = '';
  let errorString = '';

  // Collect data from script
  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
    console.log(`Python stdout: ${data}`);
  });

  // Collect errors from script
  pythonProcess.stderr.on('data', (data) => {
    errorString += data.toString();
    console.error(`Python stderr: ${data}`);
  });

  // When the script exits
  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    
    if (code !== 0) {
      return res.status(500).json({ 
        error: 'Scraping failed', 
        details: errorString 
      });
    }
    
    try {
      // Parse the JSON output from the Python script
      const results = JSON.parse(dataString);
      res.json({ success: true, results });
    } catch (e) {
      res.status(500).json({ 
        error: 'Failed to parse results', 
        details: e.message,
        raw: dataString
      });
    }
  });
});

// Endpoint to store results in database
app.post('/api/save-leads', (req, res) => {
  const { leads, userId } = req.body;
  
  if (!leads || !Array.isArray(leads)) {
    return res.status(400).json({ error: 'Valid leads array is required' });
  }

  // Here you would integrate with your database
  // Example: saveLeadsToSupabase(leads, userId)
  
  // For now, we'll just send back a success response
  res.json({ success: true, message: `${leads.length} leads saved successfully` });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
}); 