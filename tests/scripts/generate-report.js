/**
 * TFDTRONIC - Generate Test Report
 * Tạo báo cáo chi tiết từ các kết quả test
 */

const fs = require('fs');
const path = require('path');

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
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

// Get latest report file
function getLatestReport() {
  const reportsDir = path.join(__dirname, '..', 'reports');

  if (!fs.existsSync(reportsDir)) {
    return null;
  }

  const files = fs.readdirSync(reportsDir)
    .filter(f => f.startsWith('test-results-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(reportsDir, f),
      time: fs.statSync(path.join(reportsDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    return null;
  }

  return JSON.parse(fs.readFileSync(files[0].path, 'utf-8'));
}

function generateHTMLReport(data) {
  const reportsDir = path.join(__dirname, '..', 'reports');
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `bug-report-${date}-${time}.html`;

  const passRate = data.total > 0 ? ((data.passed / data.total) * 100).toFixed(1) : 0;
  const passColor = passRate >= 80 ? colors.green : passRate >= 50 ? colors.yellow : colors.red;

  let html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TFDTRONIC Test Report - ${new Date().toLocaleDateString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f5f5f5;
      color: #333;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      color: #1a73e8;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #1a73e8;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
    }
    .pass { color: #28a745; }
    .fail { color: #dc3545; }
    .warn { color: #ffc107; }
    .pass-bg { background: #d4edda; }
    .fail-bg { background: #f8d7da; }
    .warn-bg { background: #fff3cd; }
    .errors-section, .warnings-section {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .errors-section h2 { color: #dc3545; margin-bottom: 15px; }
    .warnings-section h2 { color: #ffc107; margin-bottom: 15px; }
    .error-item, .warning-item {
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 10px;
    }
    .error-item { background: #f8d7da; }
    .warning-item { background: #fff3cd; }
    .error-item h4, .warning-item h4 {
      margin-bottom: 5px;
      font-size: 16px;
    }
    .error-item p, .warning-item p {
      font-size: 14px;
      color: #666;
    }
    .suggestion {
      margin-top: 10px;
      padding: 10px;
      background: rgba(0,0,0,0.05);
      border-radius: 5px;
      font-family: monospace;
      font-size: 13px;
    }
    .tests-table {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow-x: auto;
    }
    .tests-table h2 { margin-bottom: 15px; }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #666;
    }
    tr:hover { background: #f8f9fa; }
    .status-pass { color: #28a745; }
    .status-fail { color: #dc3545; }
    .status-warn { color: #ffc107; }
    .status-skip { color: #6c757d; }
    .timestamp {
      text-align: right;
      color: #999;
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🐛 TFDTRONIC Test Report</h1>
    <p style="color: #666; margin-bottom: 20px;">
      Generated: ${new Date().toLocaleString()}
    </p>

    <div class="summary">
      <div class="summary-card">
        <h3>Total Tests</h3>
        <div class="value">${data.total}</div>
      </div>
      <div class="summary-card">
        <h3>Passed</h3>
        <div class="value pass">${data.passed}</div>
      </div>
      <div class="summary-card">
        <h3>Failed</h3>
        <div class="value fail">${data.failed}</div>
      </div>
      <div class="summary-card">
        <h3>Skipped</h3>
        <div class="value warn">${data.skipped}</div>
      </div>
      <div class="summary-card">
        <h3>Pass Rate</h3>
        <div class="value" style="color: ${passRate >= 80 ? '#28a745' : passRate >= 50 ? '#ffc107' : '#dc3545'}">${passRate}%</div>
      </div>
    </div>
`;

  if (data.errors && data.errors.length > 0) {
    html += `
    <div class="errors-section">
      <h2>🔴 Errors (Need Fix)</h2>
      ${data.errors.map((err, i) => `
        <div class="error-item">
          <h4>${i + 1}. ${err.category}</h4>
          <p><strong>Error:</strong> ${err.error}</p>
          ${err.endpoint ? `<p><strong>Endpoint:</strong> ${err.endpoint}</p>` : ''}
          <div class="suggestion">
            💡 <strong>Suggestion:</strong> ${err.suggestion || 'Check the implementation'}
          </div>
        </div>
      `).join('')}
    </div>
`;
  }

  if (data.warnings && data.warnings.length > 0) {
    html += `
    <div class="warnings-section">
      <h2>🟡 Warnings</h2>
      ${data.warnings.map((warn, i) => `
        <div class="warning-item">
          <h4>${warn.category}</h4>
          <p>${warn.warning}</p>
        </div>
      `).join('')}
    </div>
`;
  }

  html += `
    <div class="tests-table">
      <h2>📋 Test Results</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Test</th>
            <th>Status</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
`;

  if (data.tests && data.tests.length > 0) {
    data.tests.forEach(test => {
      const statusClass = test.status === 'PASS' ? 'status-pass' :
                          test.status === 'FAIL' ? 'status-fail' :
                          test.status === 'WARN' ? 'status-warn' : 'status-skip';
      const statusIcon = test.status === 'PASS' ? '✅' :
                         test.status === 'FAIL' ? '❌' :
                         test.status === 'WARN' ? '⚠️' : '⏭️';

      html += `
          <tr>
            <td>${test.category}</td>
            <td>${test.testName}</td>
            <td class="${statusClass}">${statusIcon} ${test.status}</td>
            <td>${new Date(test.timestamp).toLocaleTimeString()}</td>
          </tr>
`;
    });
  } else {
    html += `
          <tr>
            <td colspan="4" style="text-align: center; color: #999;">
              No test results available. Run tests first.
            </td>
          </tr>
`;
  }

  html += `
        </tbody>
      </table>
    </div>

    <p class="timestamp">
      Report generated at: ${new Date().toISOString()}
    </p>
  </div>
</body>
</html>
`;

  const reportPath = path.join(reportsDir, filename);
  fs.writeFileSync(reportPath, html);

  return reportPath;
}

function generateMarkdownReport(data) {
  const reportsDir = path.join(__dirname, '..', 'reports');
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `bug-report-${date}-${time}.md`;

  let md = `# 🐛 TFDTRONIC Test Report\n\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Tests | ${data.total} |\n`;
  md += `| Passed | ${data.passed} |\n`;
  md += `| Failed | ${data.failed} |\n`;
  md += `| Skipped | ${data.skipped} |\n`;
  md += `| Pass Rate | ${((data.passed / data.total) * 100).toFixed(1)}% |\n\n`;

  if (data.errors && data.errors.length > 0) {
    md += `## 🔴 Errors (Need Fix)\n\n`;
    data.errors.forEach((err, i) => {
      md += `### ${i + 1}. ${err.category}\n\n`;
      md += `- **Error:** ${err.error}\n`;
      if (err.endpoint) md += `- **Endpoint:** ${err.endpoint}\n`;
      md += `- **Suggestion:** ${err.suggestion || 'Check the implementation'}\n\n`;
    });
  }

  if (data.warnings && data.warnings.length > 0) {
    md += `## 🟡 Warnings\n\n`;
    data.warnings.forEach(warn => {
      md += `- **${warn.category}:** ${warn.warning}\n`;
    });
    md += `\n`;
  }

  md += `## 📋 Detailed Test Results\n\n`;
  md += `| Category | Test | Status | Time |\n`;
  md += `|----------|------|--------|------|\n`;

  if (data.tests && data.tests.length > 0) {
    data.tests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' :
                   test.status === 'FAIL' ? '❌' :
                   test.status === 'WARN' ? '⚠️' : '⏭️';
      md += `| ${test.category} | ${test.testName} | ${icon} ${test.status} | ${new Date(test.timestamp).toLocaleTimeString()} |\n`;
    });
  } else {
    md += `| - | No test results available | - | - |\n`;
  }

  const reportPath = path.join(reportsDir, filename);
  fs.writeFileSync(reportPath, md);

  return reportPath;
}

// Main
function main() {
  console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════════╗
║         TFDTRONIC - Generate Test Report                  ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);

  const data = getLatestReport();

  if (!data) {
    console.log(`${colors.yellow}⚠️  No test results found!${colors.reset}`);
    console.log(`   Please run tests first: ${colors.cyan}node scripts/run-all-tests.js${colors.reset}\n`);
    return;
  }

  console.log(`${colors.green}✓ Found test results${colors.reset}\n`);

  console.log(`Generating reports...\n`);

  const htmlPath = generateHTMLReport(data);
  console.log(`  ${colors.green}✓${colors.reset} HTML Report: ${htmlPath}`);

  const mdPath = generateMarkdownReport(data);
  console.log(`  ${colors.green}✓${colors.reset} Markdown Report: ${mdPath}`);

  console.log(`\n${colors.green}✓ Reports generated successfully!${colors.reset}\n`);
}

main();
