#!/usr/bin/env node
/**
 * =============================================================================
 * JOL-HUB Compliance Audit Script
 * =============================================================================
 * Automated compliance checks before deployment
 * Acts like a "spell checker" for compliance - catches mistakes before
 * they become GDPR fines.
 * 
 * Usage: pnpm compliance:check
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// Configuration
// =============================================================================

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// ANSI color codes for output
const COLORS = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  AMBER: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Recursively get all files with given extensions
 */
function getAllFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      files.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Read file contents safely
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Check if file exists
 */
function fileExists(relativePath) {
  const fullPath = path.join(SRC_DIR, relativePath);
  return fs.existsSync(fullPath);
}

// =============================================================================
// Compliance Checks
// =============================================================================

const checks = [
  // ---------------------------------------------------------------------------
  // CRITICAL: GDPR Data Residency Checks
  // ---------------------------------------------------------------------------
  {
    name: 'GDPR CountryGuard Present in Dashboard Layout',
    category: 'GDPR',
    test: () => {
      const layoutPaths = [
        'app/(dashboard)/layout.tsx',
        'app/(dashboard)/layout.ts',
      ];
      
      for (const layoutPath of layoutPaths) {
        if (fileExists(layoutPath)) {
          const content = readFile(path.join(SRC_DIR, layoutPath));
          if (content && (content.includes('CountryGuard') || content.includes('useCountry'))) {
            return true;
          }
        }
      }
      return false;
    },
    severity: 'CRITICAL',
    description: 'Dashboard layout must include CountryGuard for GDPR Article 44 data residency enforcement',
  },

  {
    name: 'Bitrix24 Webhook Signature Verification',
    category: 'SECURITY',
    test: () => {
      const webhookPath = path.join(SRC_DIR, 'app/api/bitrix24/webhook/route.ts');
      if (!fs.existsSync(webhookPath)) return false;
      
      const content = readFile(webhookPath);
      return content && content.includes('verifyBitrixSignature');
    },
    severity: 'CRITICAL',
    description: 'Webhook must verify signature to prevent spoofing attacks',
  },

  {
    name: 'GDPR Residency Check in Webhook',
    category: 'GDPR',
    test: () => {
      const webhookPath = path.join(SRC_DIR, 'app/api/bitrix24/webhook/route.ts');
      if (!fs.existsSync(webhookPath)) return false;
      
      const content = readFile(webhookPath);
      return content && (
        content.includes('getCountryForEntity') ||
        content.includes('residency') ||
        content.includes('GDPR')
      );
    },
    severity: 'CRITICAL',
    description: 'Webhook must verify data residency before processing (GDPR Article 44)',
  },

  {
    name: 'Circuit Breaker Implementation',
    category: 'RELIABILITY',
    test: () => {
      const webhookPath = path.join(SRC_DIR, 'app/api/bitrix24/webhook/route.ts');
      if (!fs.existsSync(webhookPath)) return false;
      
      const content = readFile(webhookPath);
      return content && (
        content.includes('isSyncPaused') ||
        content.includes('circuitBreaker') ||
        content.includes('CIRCUIT_BREAKER')
      );
    },
    severity: 'HIGH',
    description: 'Circuit breaker prevents cascade failures during Bitrix24 outages',
  },

  // ---------------------------------------------------------------------------
  // HIGH: Security Checks
  // ---------------------------------------------------------------------------
  {
    name: 'No Hardcoded Secrets',
    category: 'SECURITY',
    test: () => {
      const files = getAllFiles(SRC_DIR);
      const sensitivePatterns = [
        /password\s*[:=]\s*['"][^'"]+['"]/i,
        /secret\s*[:=]\s*['"][^'"]+['"]/i,
        /api_key\s*[:=]\s*['"][^'"]+['"]/i,
        /apikey\s*[:=]\s*['"][^'"]+['"]/i,
        /token\s*[:=]\s*['"][^'"]+['"]/i,
      ];
      
      for (const file of files) {
        const content = readFile(file);
        if (!content) continue;
        
        // Skip if it's using environment variables
        if (content.includes('process.env')) continue;
        
        for (const pattern of sensitivePatterns) {
          if (pattern.test(content)) {
            return false;
          }
        }
      }
      return true;
    },
    severity: 'HIGH',
    description: 'Hardcoded secrets can be leaked to version control',
  },

  {
    name: 'Audit Logging in Critical Paths',
    category: 'COMPLIANCE',
    test: () => {
      const webhookPath = path.join(SRC_DIR, 'app/api/bitrix24/webhook/route.ts');
      if (!fs.existsSync(webhookPath)) return false;
      
      const content = readFile(webhookPath);
      return content && content.includes('createAuditLog');
    },
    severity: 'HIGH',
    description: 'SOC2 requires audit logging for all data operations',
  },

  // ---------------------------------------------------------------------------
  // MEDIUM: Canon Law Checks
  // ---------------------------------------------------------------------------
  {
    name: 'Canonical Approval Component Exists',
    category: 'CANON_LAW',
    test: () => {
      const componentPaths = [
        'components/entities/CanonicalApproval.tsx',
        'components/CanonicalApproval.tsx',
      ];
      
      for (const compPath of componentPaths) {
        if (fileExists(compPath)) {
          const content = readFile(path.join(SRC_DIR, compPath));
          if (content && (content.includes('Canon Law') || content.includes('CIC 1300'))) {
            return true;
          }
        }
      }
      return false;
    },
    severity: 'MEDIUM',
    description: 'Catholic entities require canonical approval workflow (Canon Law CIC 1300-1307)',
  },

  {
    name: 'File Encryption Before Upload',
    category: 'GDPR',
    test: () => {
      const approvalPath = path.join(SRC_DIR, 'components/entities/CanonicalApproval.tsx');
      if (!fs.existsSync(approvalPath)) return true; // Skip if component doesn't exist
      
      const content = readFile(approvalPath);
      return content && (
        content.includes('encryptFile') ||
        content.includes('encrypt') ||
        content.includes('GDPR Article 32')
      );
    },
    severity: 'MEDIUM',
    description: 'GDPR Article 32 requires encryption of sensitive data during upload',
  },

  // ---------------------------------------------------------------------------
  // LOW: Best Practices
  // ---------------------------------------------------------------------------
  {
    name: 'Environment Variables Documented',
    category: 'CONFIGURATION',
    test: () => {
      const envExamplePath = path.join(ROOT_DIR, '.env.local.example');
      return fs.existsSync(envExamplePath);
    },
    severity: 'LOW',
    description: '.env.local.example should document all required environment variables',
  },

  {
    name: 'Gitignore Contains .env.local',
    category: 'SECURITY',
    test: () => {
      const gitignorePath = path.join(ROOT_DIR, '.gitignore');
      if (!fs.existsSync(gitignorePath)) return false;
      
      const content = readFile(gitignorePath);
      return content && content.includes('.env.local');
    },
    severity: 'HIGH',
    description: '.env.local must be in .gitignore to prevent secret leaks',
  },

  {
    name: 'TypeScript Strict Mode',
    category: 'QUALITY',
    test: () => {
      const tsconfigPath = path.join(ROOT_DIR, 'tsconfig.json');
      if (!fs.existsSync(tsconfigPath)) return false;
      
      const content = readFile(tsconfigPath);
      try {
        const config = JSON.parse(content);
        return config.compilerOptions?.strict === true;
      } catch {
        return false;
      }
    },
    severity: 'LOW',
    description: 'TypeScript strict mode catches more potential bugs',
  },
];

// =============================================================================
// Run Compliance Audit
// =============================================================================

function runAudit() {
  console.log(`\n${COLORS.BOLD}${COLORS.BLUE}═══════════════════════════════════════════════════════════════${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}JOL-HUB Compliance Audit${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}${COLORS.BLUE}═══════════════════════════════════════════════════════════════${COLORS.RESET}\n`);

  let passed = 0;
  let failed = 0;
  let warnings = 0;
  
  const results = {
    passed: [],
    failed: [],
    warnings: [],
  };

  // Group checks by category
  const categories = {};
  checks.forEach(check => {
    const cat = check.category || 'GENERAL';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(check);
  });

  // Run checks by category
  for (const [category, categoryChecks] of Object.entries(categories)) {
    console.log(`\n${COLORS.BOLD}[${category}]${COLORS.RESET}`);
    
    for (const check of categoryChecks) {
      const result = check.test();
      const severityColor = check.severity === 'CRITICAL' ? COLORS.RED :
                           check.severity === 'HIGH' ? COLORS.AMBER :
                           check.severity === 'MEDIUM' ? COLORS.YELLOW :
                           COLORS.BLUE;
      
      if (result) {
        console.log(`  ${COLORS.GREEN}✓${COLORS.RESET} ${check.name} ${COLORS.YELLOW}[${check.severity}]${COLORS.RESET}`);
        passed++;
        results.passed.push(check);
      } else if (check.severity === 'LOW') {
        console.log(`  ${COLORS.YELLOW}⚠${COLORS.RESET} ${check.name} ${severityColor}[${check.severity}]${COLORS.RESET}`);
        warnings++;
        results.warnings.push(check);
      } else {
        console.log(`  ${COLORS.RED}✗${COLORS.RESET} ${check.name} ${severityColor}[${check.severity}]${COLORS.RESET}`);
        console.log(`    ${COLORS.RED}→ ${check.description}${COLORS.RESET}`);
        failed++;
        results.failed.push(check);
      }
    }
  }

  // Print summary
  console.log(`\n${COLORS.BOLD}${COLORS.BLUE}═══════════════════════════════════════════════════════════════${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}Summary${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}${COLORS.BLUE}═══════════════════════════════════════════════════════════════${COLORS.RESET}`);
  console.log(`  ${COLORS.GREEN}Passed: ${passed}${COLORS.RESET}`);
  console.log(`  ${COLORS.YELLOW}Warnings: ${warnings}${COLORS.RESET}`);
  console.log(`  ${COLORS.RED}Failed: ${failed}${COLORS.RESET}`);
  console.log();

  if (failed > 0) {
    console.log(`${COLORS.RED}${COLORS.BOLD}✗ ${failed} compliance check(s) FAILED. Fix before deployment.${COLORS.RESET}\n`);
    
    // Print failed checks details
    console.log(`${COLORS.BOLD}Failed Checks:${COLORS.RESET}`);
    results.failed.forEach((check, i) => {
      console.log(`  ${i + 1}. ${COLORS.RED}${check.name}${COLORS.RESET}`);
      console.log(`     Category: ${check.category}`);
      console.log(`     Severity: ${check.severity}`);
      console.log(`     Fix: ${check.description}`);
    });
    
    process.exit(1);
  } else {
    console.log(`${COLORS.GREEN}${COLORS.BOLD}✓ All critical compliance checks passed!${COLORS.RESET}\n`);
    process.exit(0);
  }
}

// Run the audit
runAudit();
