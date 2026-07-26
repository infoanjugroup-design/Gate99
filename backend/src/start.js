const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { server, uploads, nocodb: nocodbConfig } = require('./config');
const nc = require('./nocodb');
const { route } = require('./actions');

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' })); // base64 file uploads ride in the JSON body

fs.mkdirSync(uploads.dir, { recursive: true });
app.use('/uploads', express.static(uploads.dir));

app.post(['/', '/exec'], async (req, res) => {
  try {
    const out = await route(req.body || {});
    res.json(out);
  } catch (e) {
    res.json({ status: 'error', message: 'Server error: ' + e.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/setup-tables', async (req, res) => {
  try {
    const manualBaseId = req.query.baseId || null;
    const result = await nc.ensureAllTables(manualBaseId);
    res.json({ status: 'success', message: 'All tables ready in NocoDB.', data: result });
  } catch (e) {
    res.json({ status: 'error', message: e.response?.data?.message || e.message });
  }
});

async function start() {
  console.log('Connecting to NocoDB and ensuring all tables exist...');
  try {
    await nc.ensureAllTables(nocodbConfig.baseId || null);
    console.log('✓ All tables ready in NocoDB.');
  } catch (e) {
    console.error('✗ Could not set up NocoDB tables on boot:', e.response?.data || e.message);
    console.error('  Check NOCODB_URL / NOCODB_API_TOKEN in .env — server will still start,');
    console.error('  and will retry table setup on the first "linkDatabase" request.');
  }
  app.listen(server.port, () => {
    console.log(`GATE99 backend listening on http://localhost:${server.port}`);
    console.log(`Paste this URL into the frontend's "Database URL" field.`);
  });
}

start();
