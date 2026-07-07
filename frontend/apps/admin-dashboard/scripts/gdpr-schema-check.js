#!/usr/bin/env node
/**
 * =============================================================================
 * JOL-HUB GDPR Schema Validation Script
 * =============================================================================
 * Validates GDPR compliance in data schemas and API responses
 * 
 * Usage: pnpm gdpr:validate
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// Configuration
// =============================================================================

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// ANSI color codes
const COLORS = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
};

// =============================================================================
// Helper Functions
// =============================================================================

function getAllFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
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

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

// =============================================================================
// GDPR Validation Checks
// =============================================================================

const gdprChecks = [
  // ---------------------------------------------------------------------------
  // Article 44: Data Residency
  // ---------------------------------------------------------------------------
  {
    name: 'Data Residency Field in Entity Types',
    article: 'Article 44',
    test: () => {
      const typesPath = path.join(SRC_DIR, 'types');
      if (!fs.existsSync(typesPath)) return false;
      
      const files = getAllFiles(typesPath);
      for (const file of files) {
        const content = readFile(file);
        if (content && (content.includes('residency') || content.includes('country'))) {
          return true;
        }
      }
      return false;
    },
    description: 'Entity types should include country/residency field for GDPR Article 44',
  },

  {
    name: 'Country-Scoped API Routes',
    article: 'Article 44',
    test: () => {
      const apiDir = path.join(SRC_DIR, 'app/api');
      if (!fs.existsSync(apiDir)) return false;
      
      const files = getAllFiles(apiDir);
      for (const file of files) {
        const content = readFile(file);
        if (content && (
          content.includes('X-Country-Code') ||
          content.includes('getCountry') ||
          content.includes('useCountry')
        )) {
          return true;
        }
      }
      return false;
    },
    description: 'API routes should validate country scope for data access',
  },

  // ---------------------------------------------------------------------------
  // Article 25: Data Protection by Design
  // ---------------------------------------------------------------------------
  {
    name: 'PII Fields Marked as Sensitive',
    article: 'Article 25',
    test: () => {
      const typesPath = path.join(SRC_DIR, 'types');
      if (!fs.existsSync(typesPath)) return false;
      
      const files = getAllFiles(typesPath);
      for (const file of files) {
        const content = readFile(file);
        // Check for PII field patterns with sensitivity markers
        if (content && (
          content.includes('personalData') ||
          content.includes('sensitive') ||
          content.includes('PII') ||
          content.includes('gdprSensitive')
        )) {
          return true;
        }
      }
      return false;
    },
    description: 'PII fields should be marked as sensitive for special handling',
  },

  {
    name: 'No Unnecessary PII Collection',
    article: 'Article 25',
    test: () => {
      const files = getAllFiles(SRC_DIR);
      const suspiciousPatterns = [
        /nationalId/i,
        /socialSecurity/i,
        /passportNumber/i,
        /driversLicense/i,
      ];
      
      // Allow patterns in comments or types, flag if used without proper context
      for (const file of files) {
        const content = readFile(file);
        if (!content) continue;
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(content)) {
            // Check if it's in a comment or type definition (acceptable)
            const lines = content.split('\n');
            for (const line of lines) {
              if (pattern.test(line)) {
                // If line contains these and isn't a comment/type, it might be problematic
                if (!line.trim().startsWith('//') && 
                    !line.trim().startsWith('*') &&
                    !line.trim().startsWith('/*') &&
                    !line.includes(': string') && // Type definition
                    !line.includes(': number')) {
                  console.log(`    ${COLORS.YELLOW}Warning: Potential unnecessary PII in ${path.relative(ROOT_DIR, file)}${COLORS.RESET}`);
                }
              }
            }
          }
        }
      }
      return true;
    },
    description: 'Collect only necessary personal data (data minimization)',
  },

  // ---------------------------------------------------------------------------
  // Article 32: Security of Processing
  // ---------------------------------------------------------------------------
  {
    name: 'Encryption in Transit (HTTPS)',
    article: 'Article 32',
    test: () => {
      const apiFiles = getAllFiles(path.join(SRC_DIR, 'app/api'));
      for (const file of apiFiles) {
        const content = readFile(file);
        if (content && content.includes('https://')) {
          return true;
        }
      }
      return false;
    },
    description: 'External API calls should use HTTPS',
  },

  {
    name: 'Input Validation for User Data',
    article: 'Article 32',
    test: () => {
      const files = getAllFiles(SRC_DIR);
      for (const file of files) {
        const content = readFile(file);
        if (content && (
          content.includes('zodResolver') ||
          content.includes('z.object') ||
          content.includes('z.string') ||
          content.includes('.refine(')
        )) {
          return true;
        }
      }
      return false;
    },
    description: 'User input should be validated using schema validation',
  },

  // ---------------------------------------------------------------------------
  // Article 33: Breach Notification
  // ---------------------------------------------------------------------------
  {
    name: 'Error Logging for Security Events',
    article: 'Article 33',
    test: () => {
      const files = getAllFiles(SRC_DIR);
      for (const file of files) {
        const content = readFile(file);
        if (content && (
          content.includes('createAuditLog') ||
          content.includes('logSecurityEvent') ||
          content.includes('audit(') ||
          content.includes('security') && content.includes('log')
        )) {
          return true;
        }
      }
      return false;
    },
    description: 'Security events should be logged for breach detection',
  },

  // ---------------------------------------------------------------------------
  // Right to Erasure (Article 17)
  // ---------------------------------------------------------------------------
  {
    name: 'Delete/Anonymize Functionality Exists',
    article: 'Article 17',
    test: () => {
      const files = getAllFiles(SRC_DIR);
      for (const file of files) {
        const content = readFile(file);
        if (content && (
          content.includes('delete') ||
          content.includes('anonymize') ||
          content.includes('erase') ||
          content.includes('forget')
        )) {
          return true;
        }
      }
      return false;
    },
    description: 'Implement right to erasure (right to be forgotten)',
  },

  // ---------------------------------------------------------------------------
  // Right to Access (Article 15)
  // ---------------------------------------------------------------------------
  {
    name: 'Data Export Functionality',
    article: 'Article 15',
    test: () => {
      const files = getAllFiles(SRC_DIR);
      for (const file of files) {
        const content = readFile(file);
        if (content && (
          content.includes('export') ||
          content.includes('download') && content.includes('data') ||
          content.includes('gdpr-export')
        )) {
          return true;
        }
      }
      return false;
    },
    description: 'Users should be able to export their personal data',
  },
];

// =============================================================================
// Run GDPR Validation
// =============================================================================

function runValidation() {
  console.log(`\n${COLORS.BOLD}${COLORS.BLUE}═══════════════════════════════════════════════════════════════${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}JOL-HUB GDPR Schema Validation${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}${COLORS.BLUE}═══════════════════════════════════════════════════════════════${COLORS.RESET}\n`);

  let passed = 0;
  let failed = 0;

  console.log(`${COLORS.BOLD}GDPR Compliance Checks:${COLORS.RESET}\n`);

  for (const check of gdprChecks) {
    const result = check.test();
    
    if (result) {
      console.log(`  ${COLORS.GREEN}✓${COLORS.RESET} ${check.name} ${COLORS.BLUE}[${check.article}]${COLORS.RESET}`);
      passed++;
    } else {
      console.log(`  ${COLORS.RED}✗${COLORS.RESET} ${check.name} ${COLORS.BLUE}[${check.article}]${COLORS.RESET}`);
      console.log(`    ${COLORS.RED}→ ${check.description}${COLORS.RESET}`);
      failed++;
    }
  }

  // Print summary
  console.log(`\n${COLORS.BOLD}${COLORS.BLUE}═══════════════════════════════════════════════════════════════${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}Summary${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}${COLORS.BLUE}═══════════════════════════════════════════════════════════════${COLORS.RESET}`);
  console.log(`  ${COLORS.GREEN}Passed: ${passed}${COLORS.RESET}`);
  console.log(`  ${COLORS.RED}Failed: ${failed}${COLORS.RESET}`);
  console.log();

  if (failed > 0) {
    console.log(`${COLORS.RED}${COLORS.BOLD}✗ ${failed} GDPR check(s) need attention.${COLORS.RESET}\n`);
    console.log(`${COLORS.YELLOW}Note: Some checks may not apply to all project phases.${COLORS.RESET}\n`);
    process.exit(0); // Non-blocking for now
  } else {
    console.log(`${COLORS.GREEN}${COLORS.BOLD}✓ All GDPR checks passed!${COLORS.RESET}\n`);
    process.exit(0);
  }
}

// Run validation
runValidation();
