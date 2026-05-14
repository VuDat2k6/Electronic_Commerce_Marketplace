/**
 * TFDTRONIC - Test Suite Runner
 * Chạy tất cả các test và tạo báo cáo
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[FAIL]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n${colors.bright}${msg}${colors.reset}\n${colors.blue}${'='.repeat(60)}${colors.reset}`),
};

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
  errors: [],
  warnings: [],
  startTime: new Date(),
  endTime: null,
};

// API Base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ============================================
// TEST CATEGORIES
// ============================================

const testCategories = {
  '1. API Health Check': testApiHealth,
  '2. API Products': testProductsAPI,
  '3. API Categories': testCategoriesAPI,
  '4. API Users': testUsersAPI,
  '5. API Orders': testOrdersAPI,
  '6. API Auth': testAuthAPI,
  '7. API Vouchers': testVouchersAPI,
  '8. API Wishlist': testWishlistAPI,
  '9. API Notifications': testNotificationsAPI,
  '10. API Search': testSearchAPI,
  '11. Frontend Pages': testFrontendPages,
  '12. Component Structure': testComponentStructure,
  '13. Database Schema': testDatabaseSchema,
  '14. Environment Variables': testEnvironmentVariables,
};

// ============================================
// TEST FUNCTIONS
// ============================================

async function testApiHealth() {
  const category = 'API Health Check';
  log.info(`Testing API at ${API_BASE_URL}...`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const status = response.status;

    if (status === 200) {
      addResult(category, 'API server responding', 'PASS');
      log.success('API server is running');
    } else if (status === 401 || status === 403) {
      addResult(category, 'API server responding (auth required)', 'PASS');
      log.success('API server is running (requires auth)');
    } else {
      addResult(category, `API responded with status ${status}`, 'FAIL');
      log.error(`API returned status ${status}`);
    }
  } catch (error) {
    addResult(category, `API not reachable: ${error.message}`, 'FAIL');
    log.error(`API not reachable: ${error.message}`);
    testResults.errors.push({ category, error: error.message, suggestion: 'Start the backend server: cd server && npm start' });
  }

  // Test frontend
  try {
    const response = await fetch(`${FRONTEND_URL}`);
    if (response.ok) {
      addResult(category, 'Frontend server responding', 'PASS');
      log.success('Frontend server is running');
    } else {
      addResult(category, `Frontend returned status ${response.status}`, 'FAIL');
      log.error(`Frontend returned status ${response.status}`);
    }
  } catch (error) {
    addResult(category, `Frontend not reachable: ${error.message}`, 'FAIL');
    log.error(`Frontend not reachable: ${error.message}`);
    testResults.errors.push({ category, error: error.message, suggestion: 'Start the frontend: npm run dev' });
  }
}

async function testProductsAPI() {
  const category = 'API Products';

  // Test GET /api/products
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const data = await response.json();

    if (response.ok) {
      addResult(category, 'GET /api/products - Returns products list', 'PASS');
      log.success('GET /api/products - OK');

      // Check data structure
      if (Array.isArray(data)) {
        addResult(category, 'Products data is an array', 'PASS');
      } else if (data.data && Array.isArray(data.data)) {
        addResult(category, 'Products data.data is an array', 'PASS');
      } else {
        addResult(category, 'Products data structure unknown', 'WARN');
        testResults.warnings.push({ category, warning: 'Products data structure may not match expected format' });
      }
    } else {
      addResult(category, `GET /api/products - Failed with status ${response.status}`, 'FAIL');
      log.error(`GET /api/products - Failed with status ${response.status}`);
    }
  } catch (error) {
    addResult(category, `GET /api/products - Error: ${error.message}`, 'FAIL');
    log.error(`GET /api/products - Error: ${error.message}`);
    testResults.errors.push({ category, error: error.message, endpoint: '/api/products' });
  }

  // Test GET /api/products with pagination
  try {
    const response = await fetch(`${API_BASE_URL}/api/products?page=1&limit=10`);
    if (response.ok) {
      addResult(category, 'GET /api/products with pagination', 'PASS');
      log.success('GET /api/products with pagination - OK');
    } else {
      addResult(category, `Pagination failed with status ${response.status}`, 'FAIL');
    }
  } catch (error) {
    addResult(category, `Pagination test failed: ${error.message}`, 'FAIL');
  }

  // Test GET /api/search
  try {
    const response = await fetch(`${API_BASE_URL}/api/search?q=test`);
    if (response.ok) {
      addResult(category, 'GET /api/search - Search endpoint works', 'PASS');
      log.success('GET /api/search - OK');
    } else {
      addResult(category, `Search failed with status ${response.status}`, 'FAIL');
    }
  } catch (error) {
    addResult(category, `Search test failed: ${error.message}`, 'FAIL');
  }

  // Test GET /api/slugs
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const data = await response.json();
    const products = data.data || data;
    if (products && products.length > 0) {
      const slug = products[0].slug;
      const slugResponse = await fetch(`${API_BASE_URL}/api/slugs/${slug}`);
      if (slugResponse.ok) {
        addResult(category, 'GET /api/slugs/:slug - Slug lookup works', 'PASS');
        log.success('GET /api/slugs/:slug - OK');
      } else {
        addResult(category, `Slug lookup failed with status ${slugResponse.status}`, 'FAIL');
      }
    } else {
      addResult(category, 'No products to test slug lookup', 'SKIP');
      log.warn('No products to test slug lookup');
    }
  } catch (error) {
    addResult(category, `Slug test failed: ${error.message}`, 'FAIL');
  }
}

async function testCategoriesAPI() {
  const category = 'API Categories';

  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`);

    if (response.ok) {
      addResult(category, 'GET /api/categories - Returns categories', 'PASS');
      log.success('GET /api/categories - OK');

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        addResult(category, 'Categories exist in database', 'PASS');
        log.success(`Found ${data.length} categories`);
      } else if (data.data && Array.isArray(data.data)) {
        addResult(category, 'Categories exist in database', 'PASS');
      } else {
        addResult(category, 'No categories found', 'WARN');
        testResults.warnings.push({ category, warning: 'No categories in database - may need to seed data' });
      }
    } else {
      addResult(category, `GET /api/categories - Failed with status ${response.status}`, 'FAIL');
      log.error(`GET /api/categories - Failed`);
    }
  } catch (error) {
    addResult(category, `GET /api/categories - Error: ${error.message}`, 'FAIL');
    log.error(`GET /api/categories - Error: ${error.message}`);
    testResults.errors.push({ category, error: error.message, suggestion: 'Check if /api/categories route exists' });
  }
}

async function testUsersAPI() {
  const category = 'API Users';

  try {
    const response = await fetch(`${API_BASE_URL}/api/users`);

    if (response.ok) {
      addResult(category, 'GET /api/users - Endpoint accessible', 'PASS');
      log.success('GET /api/users - OK');
    } else if (response.status === 401 || response.status === 403) {
      addResult(category, 'GET /api/users - Requires authentication', 'PASS');
      log.success('GET /api/users - Requires auth (expected)');
    } else {
      addResult(category, `GET /api/users - Status ${response.status}`, 'FAIL');
      log.error(`GET /api/users - Status ${response.status}`);
    }
  } catch (error) {
    addResult(category, `GET /api/users - Error: ${error.message}`, 'FAIL');
    log.error(`GET /api/users - Error: ${error.message}`);
  }
}

async function testOrdersAPI() {
  const category = 'API Orders';

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`);

    if (response.ok) {
      addResult(category, 'GET /api/orders - Endpoint accessible', 'PASS');
      log.success('GET /api/orders - OK');
    } else if (response.status === 401 || response.status === 403) {
      addResult(category, 'GET /api/orders - Requires authentication', 'PASS');
      log.success('GET /api/orders - Requires auth (expected)');
    } else {
      addResult(category, `GET /api/orders - Status ${response.status}`, 'FAIL');
      log.error(`GET /api/orders - Status ${response.status}`);
    }
  } catch (error) {
    addResult(category, `GET /api/orders - Error: ${error.message}`, 'FAIL');
    log.error(`GET /api/orders - Error: ${error.message}`);
  }

  // Test seller orders
  try {
    const response = await fetch(`${API_BASE_URL}/api/seller/orders`);
    if (response.ok) {
      addResult(category, 'GET /api/seller/orders - Seller orders accessible', 'PASS');
      log.success('GET /api/seller/orders - OK');
    } else if (response.status === 401 || response.status === 403) {
      addResult(category, 'GET /api/seller/orders - Requires authentication', 'PASS');
    } else {
      addResult(category, `Seller orders - Status ${response.status}`, 'WARN');
    }
  } catch (error) {
    addResult(category, `Seller orders - Error: ${error.message}`, 'WARN');
  }
}

async function testAuthAPI() {
  const category = 'API Auth';

  // Test NextAuth
  try {
    const response = await fetch(`${FRONTEND_URL}/api/auth/providers`);
    if (response.ok) {
      const data = await response.json();
      addResult(category, 'GET /api/auth/providers - Auth providers available', 'PASS');
      log.success('Auth providers - OK');

      const providers = Object.keys(data);
      if (providers.includes('credentials')) {
        addResult(category, 'Credentials provider configured', 'PASS');
      } else {
        addResult(category, 'Credentials provider not found', 'WARN');
        testResults.warnings.push({ category, warning: 'Credentials provider not configured' });
      }
    } else {
      addResult(category, `Auth providers - Status ${response.status}`, 'FAIL');
    }
  } catch (error) {
    addResult(category, `Auth providers - Error: ${error.message}`, 'FAIL');
  }
}

async function testVouchersAPI() {
  const category = 'API Vouchers';

  try {
    const response = await fetch(`${API_BASE_URL}/api/vouchers`);

    if (response.ok) {
      addResult(category, 'GET /api/vouchers - Endpoint accessible', 'PASS');
      log.success('GET /api/vouchers - OK');
    } else if (response.status === 401 || response.status === 403) {
      addResult(category, 'GET /api/vouchers - Requires authentication', 'PASS');
    } else {
      addResult(category, `GET /api/vouchers - Status ${response.status}`, 'FAIL');
    }
  } catch (error) {
    addResult(category, `GET /api/vouchers - Error: ${error.message}`, 'FAIL');
  }

  // Test voucher validation
  try {
    const response = await fetch(`${API_BASE_URL}/api/vouchers/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TEST', subtotal: 10000 }),
    });

    if (response.ok || response.status === 400) {
      addResult(category, 'POST /api/vouchers/validate - Endpoint accessible', 'PASS');
    } else {
      addResult(category, `Voucher validate - Status ${response.status}`, 'WARN');
    }
  } catch (error) {
    addResult(category, `Voucher validate - Error: ${error.message}`, 'WARN');
  }
}

async function testWishlistAPI() {
  const category = 'API Wishlist';

  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist`);

    if (response.ok) {
      addResult(category, 'GET /api/wishlist - Endpoint accessible', 'PASS');
      log.success('GET /api/wishlist - OK');
    } else if (response.status === 401 || response.status === 403) {
      addResult(category, 'GET /api/wishlist - Requires authentication', 'PASS');
    } else {
      addResult(category, `GET /api/wishlist - Status ${response.status}`, 'FAIL');
    }
  } catch (error) {
    addResult(category, `GET /api/wishlist - Error: ${error.message}`, 'FAIL');
  }
}

async function testNotificationsAPI() {
  const category = 'API Notifications';

  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications`);

    if (response.ok) {
      addResult(category, 'GET /api/notifications - Endpoint accessible', 'PASS');
      log.success('GET /api/notifications - OK');
    } else if (response.status === 401 || response.status === 403) {
      addResult(category, 'GET /api/notifications - Requires authentication', 'PASS');
    } else {
      addResult(category, `GET /api/notifications - Status ${response.status}`, 'FAIL');
    }
  } catch (error) {
    addResult(category, `GET /api/notifications - Error: ${error.message}`, 'FAIL');
  }
}

async function testSearchAPI() {
  const category = 'API Search';

  const searchTerms = ['laptop', 'phone', 'test'];

  for (const term of searchTerms) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(term)}`);

      if (response.ok) {
        addResult(category, `Search for "${term}" - Works`, 'PASS');
      } else {
        addResult(category, `Search for "${term}" - Status ${response.status}`, 'FAIL');
      }
    } catch (error) {
      addResult(category, `Search for "${term}" - Error`, 'FAIL');
    }
  }
}

async function testFrontendPages() {
  const category = 'Frontend Pages';

  const pages = [
    { url: '/', name: 'Homepage' },
    { url: '/shop', name: 'Shop' },
    { url: '/search', name: 'Search' },
    { url: '/cart', name: 'Cart' },
    { url: '/login', name: 'Login' },
    { url: '/register', name: 'Register' },
  ];

  for (const page of pages) {
    try {
      const response = await fetch(`${FRONTEND_URL}${page.url}`);
      if (response.ok) {
        addResult(category, `${page.name} (${page.url}) - Loads`, 'PASS');
        log.success(`${page.name} - OK`);
      } else {
        addResult(category, `${page.name} - Status ${response.status}`, 'FAIL');
        log.error(`${page.name} - Status ${response.status}`);
      }
    } catch (error) {
      addResult(category, `${page.name} - Error: ${error.message}`, 'FAIL');
      log.error(`${page.name} - Error: ${error.message}`);
    }
  }
}

async function testComponentStructure() {
  const category = 'Component Structure';
  const projectRoot = path.resolve(__dirname, '..');

  const requiredComponents = [
    'components/Header.tsx',
    'components/Footer.tsx',
    'components/Products.tsx',
    'components/ProductItem.tsx',
    'components/Filters.tsx',
    'components/Pagination.tsx',
    'components/modules/cart/index.tsx',
    'components/modules/wishlist/index.tsx',
  ];

  const missingComponents = [];

  for (const component of requiredComponents) {
    const filePath = path.join(projectRoot, component);
    if (fs.existsSync(filePath)) {
      addResult(category, `${component} - Exists`, 'PASS');
    } else {
      addResult(category, `${component} - Missing`, 'FAIL');
      missingComponents.push(component);
      log.error(`${component} - Missing`);
    }
  }

  if (missingComponents.length > 0) {
    testResults.errors.push({
      category: 'Component Structure',
      error: `Missing components: ${missingComponents.join(', ')}`,
      suggestion: 'Create the missing component files'
    });
  }

  // Check for unused components
  const allComponents = globSync(path.join(projectRoot, 'components/**/*.tsx'));
  log.info(`Found ${allComponents.length} components total`);
}

async function testDatabaseSchema() {
  const category = 'Database Schema';
  const projectRoot = path.resolve(__dirname, '..');

  const schemaPath = path.join(projectRoot, 'prisma/schema.prisma');

  if (!fs.existsSync(schemaPath)) {
    addResult(category, 'prisma/schema.prisma - Missing', 'FAIL');
    log.error('prisma/schema.prisma - Missing');
    testResults.errors.push({ category, error: 'schema.prisma not found' });
    return;
  }

  addResult(category, 'prisma/schema.prisma - Exists', 'PASS');
  log.success('schema.prisma - OK');

  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Check required models
  const requiredModels = [
    'model Product',
    'model User',
    'model Customer_order',
    'model SubOrder',
    'model Category',
    'model Merchant',
    'model Wishlist',
    'model Notification',
    'model Review',
    'model Voucher',
  ];

  for (const model of requiredModels) {
    if (schema.includes(model)) {
      addResult(category, `Schema contains ${model}`, 'PASS');
    } else {
      addResult(category, `Schema missing ${model}`, 'FAIL');
      log.error(`Schema missing ${model}`);
    }
  }
}

async function testEnvironmentVariables() {
  const category = 'Environment Variables';
  const projectRoot = path.resolve(__dirname, '..');

  const envPath = path.join(projectRoot, '.env');
  const envExamplePath = path.join(projectRoot, '.env.example');

  if (!fs.existsSync(envPath)) {
    addResult(category, '.env file - Missing', 'WARN');
    testResults.warnings.push({
      category,
      warning: '.env file not found - copy from .env.example'
    });
    log.warn('.env file not found');
  } else {
    addResult(category, '.env file - Exists', 'PASS');
    log.success('.env file - OK');

    // Check required variables
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];

    for (const variable of requiredVars) {
      if (envContent.includes(`${variable}=`)) {
        addResult(category, `Environment variable ${variable} - Set`, 'PASS');
      } else {
        addResult(category, `Environment variable ${variable} - Missing`, 'WARN');
        testResults.warnings.push({
          category,
          warning: `Missing environment variable: ${variable}`
        });
      }
    }
  }

  if (!fs.existsSync(envExamplePath)) {
    addResult(category, '.env.example file - Missing', 'WARN');
    testResults.warnings.push({
      category,
      warning: '.env.example not found - should be created'
    });
  } else {
    addResult(category, '.env.example file - Exists', 'PASS');
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function addResult(category, testName, status) {
  testResults.total++;
  testResults[status.toLowerCase() + 'ed']++;

  testResults.tests.push({
    category,
    testName,
    status,
    timestamp: new Date().toISOString(),
  });
}

// Simple glob implementation
function globSync(pattern) {
  const files = [];
  const baseDir = pattern.replace('/**/*.tsx', '').replace('**/*.tsx', '');

  function walk(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }

  walk(baseDir);
  return files;
}

// ============================================
// REPORT GENERATION
// ============================================

function generateReport() {
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');

  // JSON Report
  const jsonReport = {
    ...testResults,
    endTime: new Date().toISOString(),
    duration: testResults.endTime - testResults.startTime,
  };

  fs.writeFileSync(
    path.join(reportsDir, `test-results-${date}-${time}.json`),
    JSON.stringify(jsonReport, null, 2)
  );

  // Markdown Report
  let mdReport = `# TFDTRONIC Test Report\n\n`;
  mdReport += `**Date:** ${new Date().toLocaleString()}\n\n`;
  mdReport += `**Duration:** ${jsonReport.duration}ms\n\n`;

  mdReport += `## Summary\n\n`;
  mdReport += `| Metric | Value |\n`;
  mdReport += `|--------|-------|\n`;
  mdReport += `| Total Tests | ${testResults.total} |\n`;
  mdReport += `| Passed | ${testResults.passed} |\n`;
  mdReport += `| Failed | ${testResults.failed} |\n`;
  mdReport += `| Skipped | ${testResults.skipped} |\n`;
  mdReport += `| Pass Rate | ${((testResults.passed / testResults.total) * 100).toFixed(1)}% |\n\n`;

  if (testResults.errors.length > 0) {
    mdReport += `## Errors (Need Fix)\n\n`;
    testResults.errors.forEach((err, i) => {
      mdReport += `### ${i + 1}. ${err.category}\n\n`;
      mdReport += `- **Error:** ${err.error}\n`;
      mdReport += `- **Suggestion:** ${err.suggestion || 'Check the implementation'}\n\n`;
    });
  }

  if (testResults.warnings.length > 0) {
    mdReport += `## Warnings\n\n`;
    testResults.warnings.forEach((warn, i) => {
      mdReport += `- **${warn.category}:** ${warn.warning}\n`;
    });
    mdReport += `\n`;
  }

  mdReport += `## Detailed Test Results\n\n`;
  mdReport += `| Category | Test | Status |\n`;
  mdReport += `|----------|------|--------|\n`;

  testResults.tests.forEach((test) => {
    const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    mdReport += `| ${test.category} | ${test.testName} | ${statusIcon} ${test.status} |\n`;
  });

  fs.writeFileSync(
    path.join(reportsDir, `bug-report-${date}-${time}.md`),
    mdReport
  );

  return { jsonReport, mdReport };
}

function printSummary() {
  console.log('\n');
  log.header('TEST SUMMARY');
  console.log(`${colors.white}Total:${colors.reset}   ${testResults.total}`);
  console.log(`${colors.green}Passed:${colors.reset}  ${testResults.passed}`);
  console.log(`${colors.red}Failed:${colors.reset}  ${testResults.failed}`);
  console.log(`${colors.yellow}Skipped:${colors.reset} ${testResults.skipped}`);
  console.log(`\n${colors.bright}Pass Rate:${colors.reset} ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log(`\n${colors.bgRed}${colors.white} ${testResults.failed} tests failed - See reports for details ${colors.reset}\n`);
  } else {
    console.log(`\n${colors.bgGreen}${colors.white} All tests passed! ${colors.reset}\n`);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.clear();
  log.header('TFDTRONIC eCommerce - Test Suite');

  console.log(`${colors.cyan}API Base URL:${colors.reset} ${API_BASE_URL}`);
  console.log(`${colors.cyan}Frontend URL:${colors.reset} ${FRONTEND_URL}`);
  console.log(`${colors.cyan}Started at:${colors.reset} ${testResults.startTime.toLocaleString()}\n`);

  // Run all tests
  for (const [name, testFn] of Object.entries(testCategories)) {
    log.header(name);
    try {
      await testFn();
    } catch (error) {
      log.error(`Test category failed: ${error.message}`);
      testResults.errors.push({ category: name, error: error.message });
    }
  }

  // Generate report
  testResults.endTime = new Date();
  const { jsonReport, mdReport } = generateReport();

  // Print summary
  printSummary();

  console.log(`${colors.cyan}Reports saved to:${colors.reset}`);
  console.log(`  - tests/reports/test-results-*.json`);
  console.log(`  - tests/reports/bug-report-*.md\n`);
}

main().catch(console.error);
