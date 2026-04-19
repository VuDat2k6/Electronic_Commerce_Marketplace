/**
 * TFDTRONIC - Manual API Test Script
 * Test các API endpoints cụ thể
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Test results
const results = {
  tests: [],
  errors: [],
  bugs: [],
};

// Helper: Make HTTP request
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const reqOptions = {
      hostname: new URL(url).hostname,
      port: new URL(url).port,
      path: new URL(url).pathname + new URL(url).search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: JSON.parse(data || '{}'),
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: null,
          });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Add result
function addResult(name, status, details = {}) {
  results.tests.push({ name, status, ...details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${icon} ${name}`);
  if (details.message) {
    console.log(`     ${details.message}`);
  }
}

// Add bug
function addBug(category, description, severity, suggestion) {
  results.bugs.push({ category, description, severity, suggestion });
}

// ============================================
// API ENDPOINT TESTS
// ============================================

async function testProductsEndpoints() {
  console.log('\n📦 Testing Products API...\n');

  // GET /api/products
  let res = await httpRequest(`${API_BASE_URL}/api/products`);
  addResult('GET /api/products', res.status === 200 ? 'PASS' : 'FAIL', {
    status: res.status,
    hasData: !!res.json,
  });

  // GET /api/products with params
  res = await httpRequest(`${API_BASE_URL}/api/products?page=1&limit=5`);
  addResult('GET /api/products (paginated)', res.status === 200 ? 'PASS' : 'FAIL', {
    status: res.status,
  });

  // Test filter
  res = await httpRequest(`${API_BASE_URL}/api/products?status=PUBLISHED`);
  addResult('GET /api/products (filtered)', res.status === 200 ? 'PASS' : 'FAIL', {
    status: res.status,
  });

  // Test search (if endpoint exists)
  res = await httpRequest(`${API_BASE_URL}/api/search?q=laptop`);
  if (res.status === 200) {
    addResult('GET /api/search', 'PASS', { results: 'working' });
  } else {
    addResult('GET /api/search', 'FAIL', {
      status: res.status,
      message: 'Search endpoint may be broken',
    });
    addBug('Products', 'Search endpoint not working', 'MEDIUM', 'Check /api/search route in server');
  }
}

async function testCategoriesEndpoints() {
  console.log('\n📂 Testing Categories API...\n');

  const res = await httpRequest(`${API_BASE_URL}/api/categories`);

  if (res.status === 200) {
    addResult('GET /api/categories', 'PASS', {
      hasData: !!res.json,
    });

    if (res.json && res.json.length === 0) {
      addBug('Categories', 'No categories in database', 'HIGH', 'Run seed script to populate categories');
    }
  } else {
    addResult('GET /api/categories', 'FAIL', {
      status: res.status,
    });
    addBug('Categories', 'Categories endpoint returning error', 'HIGH', 'Check /api/categories route');
  }
}

async function testOrdersEndpoints() {
  console.log('\n🛒 Testing Orders API...\n');

  // GET /api/orders
  let res = await httpRequest(`${API_BASE_URL}/api/orders`);
  if (res.status === 200 || res.status === 401) {
    addResult('GET /api/orders', res.status === 200 ? 'PASS' : 'PASS', {
      status: res.status,
      message: res.status === 401 ? 'Requires auth (expected)' : 'Working',
    });
  } else {
    addResult('GET /api/orders', 'FAIL', { status: res.status });
    addBug('Orders', 'Orders endpoint error', 'HIGH', 'Check /api/orders route');
  }

  // POST /api/orders (test validation)
  res = await httpRequest(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test',
      email: 'test@test.com',
      phone: '123456',
    }),
  });

  if (res.status === 200 || res.status === 201 || res.status === 400) {
    addResult('POST /api/orders (validation)', 'PASS', {
      status: res.status,
    });
  } else {
    addResult('POST /api/orders (validation)', 'FAIL', {
      status: res.status,
    });
    addBug('Orders', 'Order creation endpoint issue', 'MEDIUM', 'Check order creation logic');
  }

  // GET /api/seller/orders
  res = await httpRequest(`${API_BASE_URL}/api/seller/orders`);
  if (res.status === 200 || res.status === 401) {
    addResult('GET /api/seller/orders', 'PASS', {
      status: res.status,
    });
  } else {
    addResult('GET /api/seller/orders', 'FAIL', { status: res.status });
  }
}

async function testUsersEndpoints() {
  console.log('\n👤 Testing Users API...\n');

  const res = await httpRequest(`${API_BASE_URL}/api/users`);

  if (res.status === 200) {
    addResult('GET /api/users', 'PASS', { users: res.json?.length || 0 });
  } else if (res.status === 401) {
    addResult('GET /api/users (auth required)', 'PASS', { status: 401 });
  } else {
    addResult('GET /api/users', 'FAIL', { status: res.status });
    addBug('Users', 'Users endpoint error', 'HIGH', 'Check /api/users route');
  }
}

async function testVouchersEndpoints() {
  console.log('\n🎟️ Testing Vouchers API...\n');

  // GET vouchers
  let res = await httpRequest(`${API_BASE_URL}/api/vouchers`);
  addResult('GET /api/vouchers', res.status === 200 ? 'PASS' : 'FAIL', {
    status: res.status,
  });

  // POST validate voucher
  res = await httpRequest(`${API_BASE_URL}/api/vouchers/validate`, {
    method: 'POST',
    body: JSON.stringify({ code: 'INVALID', subtotal: 10000 }),
  });

  if (res.status === 200 || res.status === 400) {
    addResult('POST /api/vouchers/validate', 'PASS', {
      status: res.status,
    });
  } else {
    addResult('POST /api/vouchers/validate', 'FAIL', { status: res.status });
    addBug('Vouchers', 'Voucher validation endpoint issue', 'LOW', 'Check voucher validation route');
  }
}

async function testWishlistEndpoints() {
  console.log('\n❤️ Testing Wishlist API...\n');

  const res = await httpRequest(`${API_BASE_URL}/api/wishlist`);

  if (res.status === 200 || res.status === 401) {
    addResult('GET /api/wishlist', 'PASS', {
      status: res.status,
    });
  } else {
    addResult('GET /api/wishlist', 'FAIL', { status: res.status });
    addBug('Wishlist', 'Wishlist endpoint error', 'MEDIUM', 'Check /api/wishlist route');
  }
}

async function testNotificationsEndpoints() {
  console.log('\n🔔 Testing Notifications API...\n');

  const res = await httpRequest(`${API_BASE_URL}/api/notifications`);

  if (res.status === 200 || res.status === 401) {
    addResult('GET /api/notifications', 'PASS', {
      status: res.status,
    });
  } else {
    addResult('GET /api/notifications', 'FAIL', { status: res.status });
    addBug('Notifications', 'Notifications endpoint error', 'MEDIUM', 'Check /api/notifications route');
  }
}

async function testAuthEndpoints() {
  console.log('\n🔐 Testing Auth API...\n');

  const res = await httpRequest(`${FRONTEND_URL}/api/auth/providers`);

  if (res.status === 200) {
    addResult('GET /api/auth/providers', 'PASS', {
      providers: Object.keys(res.json || {}).join(', '),
    });

    if (!res.json?.credentials) {
      addBug('Auth', 'Credentials provider not configured', 'HIGH', 'Configure credentials provider in NextAuth');
    }
  } else {
    addResult('GET /api/auth/providers', 'FAIL', { status: res.status });
    addBug('Auth', 'Auth providers endpoint error', 'HIGH', 'Check NextAuth configuration');
  }
}

async function testBulkUploadEndpoints() {
  console.log('\n📤 Testing Bulk Upload API...\n');

  const res = await httpRequest(`${API_BASE_URL}/api/bulk-upload`);

  if (res.status === 200 || res.status === 401) {
    addResult('GET /api/bulk-upload', 'PASS', {
      status: res.status,
    });
  } else {
    addResult('GET /api/bulk-upload', 'FAIL', { status: res.status });
    addBug('BulkUpload', 'Bulk upload endpoint error', 'MEDIUM', 'Check /api/bulk-upload route');
  }
}

async function testReviewsEndpoints() {
  console.log('\n⭐ Testing Reviews API...\n');

  // Test reviews stats
  let res = await httpRequest(`${API_BASE_URL}/api/reviews/stats/test-product-id`);

  if (res.status === 200 || res.status === 404 || res.status === 400) {
    addResult('GET /api/reviews/stats/:productId', 'PASS', {
      status: res.status,
    });
  } else {
    addResult('GET /api/reviews/stats/:productId', 'FAIL', { status: res.status });
  }
}

// ============================================
// FILE STRUCTURE TESTS
// ============================================

function testFileStructure() {
  console.log('\n📁 Testing File Structure...\n');

  const projectRoot = path.resolve(__dirname, '..');

  const requiredFiles = [
    'prisma/schema.prisma',
    'lib/prisma.ts',
    'lib/api.ts',
    'lib/config.ts',
    'app/_zustand/store.ts',
    'components/Header.tsx',
    'components/Footer.tsx',
    'components/Products.tsx',
    'server/app.js',
  ];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(projectRoot, file));
    addResult(`File: ${file}`, exists ? 'PASS' : 'FAIL', {
      exists,
    });

    if (!exists) {
      addBug('Structure', `Missing file: ${file}`, 'HIGH', `Create ${file}`);
    }
  }
}

function testDatabaseSchema() {
  console.log('\n🗄️ Testing Database Schema...\n');

  const schemaPath = path.resolve(__dirname, '..', 'prisma', 'schema.prisma');

  if (!fs.existsSync(schemaPath)) {
    addResult('Database schema', 'FAIL', { message: 'schema.prisma not found' });
    addBug('Database', 'schema.prisma not found', 'CRITICAL', 'Create prisma/schema.prisma');
    return;
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const requiredModels = [
    'model Product',
    'model User',
    'model Customer_order',
    'model SubOrder',
    'model Category',
    'model Merchant',
    'model Wishlist',
  ];

  for (const model of requiredModels) {
    const exists = schema.includes(model);
    addResult(`Schema: ${model}`, exists ? 'PASS' : 'FAIL', {
      exists,
    });

    if (!exists) {
      addBug('Database', `Missing model: ${model}`, 'CRITICAL', `Add ${model} to schema.prisma`);
    }
  }
}

// ============================================
// REPORT GENERATION
// ============================================

function generateBugReport() {
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `bug-report-${date}-${time}.md`;

  let report = `# 🐛 TFDTRONIC Bug Report\n\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n\n`;

  report += `## Summary\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Tests | ${results.tests.length} |\n`;
  report += `| Passed | ${results.tests.filter(t => t.status === 'PASS').length} |\n`;
  report += `| Failed | ${results.tests.filter(t => t.status === 'FAIL').length} |\n`;
  report += `| Bugs Found | ${results.bugs.length} |\n\n`;

  if (results.bugs.length > 0) {
    report += `## 🐛 Bugs & Issues\n\n`;

    // Group by severity
    const critical = results.bugs.filter(b => b.severity === 'CRITICAL');
    const high = results.bugs.filter(b => b.severity === 'HIGH');
    const medium = results.bugs.filter(b => b.severity === 'MEDIUM');
    const low = results.bugs.filter(b => b.severity === 'LOW');

    if (critical.length > 0) {
      report += `### 🔴 Critical (Must Fix)\n\n`;
      critical.forEach((bug, i) => {
        report += `${i + 1}. **${bug.category}**: ${bug.description}\n`;
        report += `   - Suggestion: ${bug.suggestion}\n\n`;
      });
    }

    if (high.length > 0) {
      report += `### 🟠 High Priority\n\n`;
      high.forEach((bug, i) => {
        report += `${i + 1}. **${bug.category}**: ${bug.description}\n`;
        report += `   - Suggestion: ${bug.suggestion}\n\n`;
      });
    }

    if (medium.length > 0) {
      report += `### 🟡 Medium Priority\n\n`;
      medium.forEach((bug, i) => {
        report += `${i + 1}. **${bug.category}**: ${bug.description}\n`;
        report += `   - Suggestion: ${bug.suggestion}\n\n`;
      });
    }

    if (low.length > 0) {
      report += `### 🟢 Low Priority\n\n`;
      low.forEach((bug, i) => {
        report += `${i + 1}. **${bug.category}**: ${bug.description}\n`;
        report += `   - Suggestion: ${bug.suggestion}\n\n`;
      });
    }
  }

  report += `## Test Results\n\n`;
  report += `| Test | Status | Details |\n`;
  report += `|------|--------|--------|\n`;
  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    report += `| ${test.name} | ${icon} ${test.status} | ${JSON.stringify(test) || '-'} |\n`;
  });

  const reportPath = path.join(reportsDir, filename);
  fs.writeFileSync(reportPath, report);

  return reportPath;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════════╗
║        TFDTRONIC eCommerce - Manual API Test Suite        ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);

  console.log(`${colors.yellow}Testing API at: ${API_BASE_URL}${colors.reset}`);
  console.log(`${colors.yellow}Testing Frontend at: ${FRONTEND_URL}${colors.reset}\n`);

  // Run all tests
  await testProductsEndpoints();
  await testCategoriesEndpoints();
  await testOrdersEndpoints();
  await testUsersEndpoints();
  await testVouchersEndpoints();
  await testWishlistEndpoints();
  await testNotificationsEndpoints();
  await testAuthEndpoints();
  await testBulkUploadEndpoints();
  await testReviewsEndpoints();
  testFileStructure();
  testDatabaseSchema();

  // Generate report
  const reportPath = generateBugReport();

  // Print summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  const passed = results.tests.filter(t => t.status === 'PASS').length;
  const failed = results.tests.filter(t => t.status === 'FAIL').length;

  console.log(`  Total Tests: ${results.tests.length}`);
  console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`  ${colors.yellow}Bugs Found: ${results.bugs.length}${colors.reset}\n`);

  if (results.bugs.length > 0) {
    console.log(`  ${colors.red}⚠️  ${results.bugs.length} bugs need attention${colors.reset}\n`);
  }

  console.log(`${colors.green}✓ Bug report saved to: ${reportPath}${colors.reset}\n`);
}

main().catch(console.error);
