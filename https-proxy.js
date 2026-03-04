import https from 'https';
import fs from 'fs';
import httpProxy from 'http-proxy';

// Configuration
const HTTPS_PORT = 2083;
const ASTRO_PORT = 2084;
const HOST = '0.0.0.0';
const CERT_PATH = '/etc/ssl/splitdo_api/cert.pem';
const KEY_PATH = '/etc/ssl/splitdo_api/private/key.pem';

// Color codes for console output
const colors = {
  proxy: '\x1b[36m', // Cyan
  error: '\x1b[31m', // Red
  success: '\x1b[32m', // Green
  reset: '\x1b[0m' // Reset
};

function log(message, color = colors.proxy) {
  console.log(`${color}[HTTPS Proxy]${colors.reset} ${message}`);
}

// Check SSL certificate files
function checkCertificates() {
  try {
    if (!fs.existsSync(CERT_PATH)) {
      throw new Error(`Certificate file not found: ${CERT_PATH}`);
    }
    if (!fs.existsSync(KEY_PATH)) {
      throw new Error(`Private key file not found: ${KEY_PATH}`);
    }
    log('SSL certificates found and accessible', colors.success);
    return true;
  } catch (error) {
    log(`Certificate error: ${error.message}`, colors.error);
    return false;
  }
}

// CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400' // 24 hours
};

// Create proxy server
function createProxy() {
  const proxy = httpProxy.createProxyServer({
    target: `http://localhost:${ASTRO_PORT}`,
    ws: true, // Enable WebSocket proxying for HMR
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000
  });

  // Add CORS headers to all proxied responses
  proxy.on('proxyRes', (proxyRes, req, res) => {
    Object.keys(CORS_HEADERS).forEach(key => {
      proxyRes.headers[key.toLowerCase()] = CORS_HEADERS[key];
    });
  });

  // Error handling for proxy
  proxy.on('error', (err, req, res) => {
    log(`Proxy error: ${err.message}`, colors.error);
    
    // Handle the case where Astro dev server isn't ready yet
    if (err.code === 'ECONNREFUSED') {
      log(`Cannot connect to Astro dev server on port ${ASTRO_PORT}. Make sure it's running.`, colors.error);
      if (res && !res.headersSent) {
        // Add CORS headers even to error responses
        Object.keys(CORS_HEADERS).forEach(key => {
          res.setHeader(key, CORS_HEADERS[key]);
        });
        res.writeHead(502, { 'Content-Type': 'text/html' });
        res.end(`
          <h1>Proxy Error</h1>
          <p>Cannot connect to Astro dev server on port ${ASTRO_PORT}</p>
          <p>Make sure the Astro dev server is running with: <code>npm run dev</code></p>
        `);
      }
    } else if (res && !res.headersSent) {
      // Add CORS headers even to error responses
      Object.keys(CORS_HEADERS).forEach(key => {
        res.setHeader(key, CORS_HEADERS[key]);
      });
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Proxy Error: ' + err.message);
    }
  });

  // Log successful proxied requests
  proxy.on('proxyReq', (proxyReq, req, res) => {
    // Only log non-asset requests to reduce noise
    if (!req.url.match(/\.(js|css|png|jpg|ico|svg|woff|woff2)$/)) {
      log(`${req.method} ${req.url} → http://localhost:${ASTRO_PORT}`);
    }
  });

  return proxy;
}

// Main function
function startProxy() {
  log('Starting HTTPS proxy server...');
  
  // Check certificates first
  if (!checkCertificates()) {
    process.exit(1);
  }

  try {
    // Read SSL certificates
    const sslOptions = {
      key: fs.readFileSync(KEY_PATH),
      cert: fs.readFileSync(CERT_PATH)
    };

    // Create proxy
    const proxy = createProxy();

    // Create HTTPS server
    const server = https.createServer(sslOptions, (req, res) => {
      // Handle OPTIONS preflight requests directly
      if (req.method === 'OPTIONS') {
        Object.keys(CORS_HEADERS).forEach(key => {
          res.setHeader(key, CORS_HEADERS[key]);
        });
        res.writeHead(204); // No Content
        res.end();
        return;
      }

      // Proxy all other requests
      proxy.web(req, res);
    });

    // Handle WebSocket upgrade for hot module replacement
    server.on('upgrade', (req, socket, head) => {
      proxy.ws(req, socket, head, (err) => {
        if (err) {
          log(`WebSocket proxy error: ${err.message}`, colors.error);
        }
      });
    });

    // Start server
    server.listen(HTTPS_PORT, HOST, () => {
      log(`HTTPS proxy running on https://${HOST}:${HTTPS_PORT}`, colors.success);
      log(`Forwarding to http://localhost:${ASTRO_PORT}`, colors.success);
      log('CORS enabled for all origins', colors.success);
      log('Ready to accept connections from CloudFlare!', colors.success);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      log('Shutting down HTTPS proxy...', colors.error);
      server.close(() => {
        log('HTTPS proxy stopped', colors.error);
        process.exit(0);
      });
    });

  } catch (error) {
    log(`Failed to start HTTPS proxy: ${error.message}`, colors.error);
    process.exit(1);
  }
}

// Start the proxy
startProxy();
