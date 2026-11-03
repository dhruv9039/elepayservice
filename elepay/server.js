// ===================================================
// ElePay Production Backend Server
// Built with Node.js & Built-in SQLite
// ===================================================

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

// Port configuration
const PORT = process.env.PORT || 3000;

// Directories
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initialize SQLite Database
const DB_PATH = path.join(DATA_DIR, 'elepay.db');
const db = new DatabaseSync(DB_PATH);

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,
    uid TEXT NOT NULL,
    amount REAL NOT NULL,
    utr_number TEXT NOT NULL,
    description TEXT NOT NULL,
    screenshot_url TEXT,
    status TEXT DEFAULT 'under_review',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✅ SQLite Database Connected & Initialized:', DB_PATH);

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

// Helper: Parse JSON Body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    // Max 15MB limit for Base64 image payload
    const MAX_SIZE = 15 * 1024 * 1024;
    
    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_SIZE) {
        req.destroy();
        reject(new Error('Payload too large (Max 15MB)'));
      }
    });

    req.on('end', () => {
      try {
        if (!body.trim()) {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });

    req.on('error', err => reject(err));
  });
}

// Helper: Send JSON Response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Helper: Save Base64 Image to Disk
function saveBase64Image(base64Data, originalFileName = 'screenshot.png') {
  if (!base64Data) return null;
  
  // Format: "data:image/png;base64,iVBORw0KGgo..."
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let ext = '.png';
  let buffer;

  if (matches && matches.length === 3) {
    const mime = matches[1];
    if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
    else if (mime.includes('webp')) ext = '.webp';
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    // Plain base64 fallback
    buffer = Buffer.from(base64Data, 'base64');
  }

  const filename = `screenshot_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  return `/uploads/${filename}`;
}

// Main HTTP Request Handler
const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(urlObj.pathname);
  const method = req.method.toUpperCase();

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // ==========================================
  // API Routes
  // ==========================================

  // Health check
  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, {
      status: 'online',
      service: 'ElePay Backend Service',
      time: new Date().toISOString()
    });
  }

  // 1. Submit Payment
  if (pathname === '/api/payments' && method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const uid = (data.uid || '').trim();
      const amount = parseFloat(data.amount) || 100;
      const payMethod = (data.method || 'qr').toLowerCase();

      if (!uid) {
        return sendJson(res, 400, { error: 'UID is required' });
      }

      const stmt = db.prepare(`
        INSERT INTO payments (uid, amount, method, status)
        VALUES (?, ?, ?, 'pending')
      `);
      const result = stmt.run(uid, amount, payMethod);

      return sendJson(res, 201, {
        success: true,
        message: 'Payment record created successfully',
        payment: {
          id: Number(result.lastInsertRowid),
          uid,
          amount,
          method: payMethod,
          status: 'pending'
        }
      });
    } catch (err) {
      console.error('Error submitting payment:', err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 2. Submit Problem / Dispute
  if (pathname === '/api/problems' && method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const uid = (data.uid || 'Not Provided').trim();
      const amount = parseFloat(data.amount) || 100;
      const utr = (data.utr || '').trim();
      const description = (data.description || '').trim();

      if (!utr) {
        return sendJson(res, 400, { error: '12-digit UTR Number is required' });
      }
      if (!description) {
        return sendJson(res, 400, { error: 'Problem description is required' });
      }

      // Save Screenshot if provided
      let screenshotUrl = null;
      if (data.screenshotBase64) {
        screenshotUrl = saveBase64Image(data.screenshotBase64, data.fileName);
      }

      // Generate Ticket ID (#ELP-XXXXXX)
      const ticketId = '#ELP-' + Math.floor(100000 + Math.random() * 900000);

      const stmt = db.prepare(`
        INSERT INTO problems (ticket_id, uid, amount, utr_number, description, screenshot_url, status)
        VALUES (?, ?, ?, ?, ?, ?, 'under_review')
      `);
      stmt.run(ticketId, uid, amount, utr, description, screenshotUrl);

      return sendJson(res, 201, {
        success: true,
        message: 'Problem ticket created successfully',
        ticket: {
          ticketId,
          uid,
          amount,
          utr,
          description,
          screenshotUrl,
          status: 'under_review'
        }
      });
    } catch (err) {
      console.error('Error logging problem:', err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 3. Admin: Overview Stats
  if (pathname === '/api/admin/overview' && method === 'GET') {
    try {
      const totalPaymentsRow = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments').get();
      const pendingPaymentsRow = db.prepare('SELECT COUNT(*) as count FROM payments WHERE status = "pending"').get();
      const verifiedPaymentsRow = db.prepare('SELECT COUNT(*) as count FROM payments WHERE status = "verified"').get();
      const totalProblemsRow = db.prepare('SELECT COUNT(*) as count FROM problems').get();
      const pendingProblemsRow = db.prepare('SELECT COUNT(*) as count FROM problems WHERE status = "under_review"').get();

      return sendJson(res, 200, {
        totalRevenue: totalPaymentsRow.total,
        totalPayments: totalPaymentsRow.count,
        pendingPayments: pendingPaymentsRow.count,
        verifiedPayments: verifiedPaymentsRow.count,
        totalProblems: totalProblemsRow.count,
        pendingProblems: pendingProblemsRow.count
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 4. Admin: Get All Payments
  if (pathname === '/api/admin/payments' && method === 'GET') {
    try {
      const payments = db.prepare('SELECT * FROM payments ORDER BY created_at DESC LIMIT 100').all();
      return sendJson(res, 200, { payments });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 5. Admin: Update Payment Status
  if (pathname.startsWith('/api/admin/payments/') && method === 'PATCH') {
    try {
      const id = pathname.split('/').pop();
      const body = await parseJsonBody(req);
      const status = (body.status || '').toLowerCase(); // verified / rejected / pending

      if (!['verified', 'rejected', 'pending'].includes(status)) {
        return sendJson(res, 400, { error: 'Invalid status' });
      }

      const stmt = db.prepare('UPDATE payments SET status = ? WHERE id = ?');
      stmt.run(status, id);

      return sendJson(res, 200, { success: true, message: `Payment ${id} marked as ${status}` });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 6. Admin: Get All Problems
  if (pathname === '/api/admin/problems' && method === 'GET') {
    try {
      const problems = db.prepare('SELECT * FROM problems ORDER BY created_at DESC LIMIT 100').all();
      return sendJson(res, 200, { problems });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 7. Admin: Update Problem Status
  if (pathname.startsWith('/api/admin/problems/') && method === 'PATCH') {
    try {
      const ticketId = decodeURIComponent(pathname.split('/').pop());
      const body = await parseJsonBody(req);
      const status = (body.status || '').toLowerCase(); // under_review / resolved / rejected

      if (!['under_review', 'resolved', 'rejected'].includes(status)) {
        return sendJson(res, 400, { error: 'Invalid status' });
      }

      const stmt = db.prepare('UPDATE problems SET status = ? WHERE ticket_id = ?');
      stmt.run(status, ticketId);

      return sendJson(res, 200, { success: true, message: `Ticket ${ticketId} marked as ${status}` });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // ==========================================
  // Static File Serving
  // ==========================================
  let filePath = '';

  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(ROOT_DIR, 'index.html');
  } else if (pathname === '/admin' || pathname === '/admin.html') {
    filePath = path.join(ROOT_DIR, 'admin.html');
  } else {
    // Sanitize path to prevent directory traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    filePath = path.join(ROOT_DIR, safePath);
  }

  // Check if file exists
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });

    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
  }

  // 404 Not Found
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

// Start Server
server.listen(PORT, () => {
  console.log(`\n===================================================`);
  console.log(`⚡ ElePay Backend Server Running Successfully!`);
  console.log(`👉 Portal URL:  http://localhost:${PORT}`);
  console.log(`👉 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`💾 SQLite DB:   ${DB_PATH}`);
  console.log(`===================================================\n`);
});

