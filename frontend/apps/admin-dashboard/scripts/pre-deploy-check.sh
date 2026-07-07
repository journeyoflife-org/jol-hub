#!/bin/bash
# =============================================================================
# JOL-HUB Admin Dashboard Pre-Deployment Checklist
# =============================================================================
# Final verification before production deployment
# Run: ./scripts/pre-deploy-check.sh
# =============================================================================

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${AMBER}⚠${NC} $1"
    ((WARNINGS++))
}

section() {
    echo ""
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

# =============================================================================
# START PRE-DEPLOYMENT CHECKS
# =============================================================================

echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}JOL-HUB Admin Dashboard Pre-Deployment Checklist${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Running final verification checks before production deployment..."
echo ""

# =============================================================================
# SECTION 1: Code Quality
# =============================================================================

section "1. Code Quality Checks"

# TypeScript compilation
echo "Checking TypeScript compilation..."
if pnpm tsc --noEmit 2>/dev/null; then
    pass "TypeScript compilation successful"
else
    fail "TypeScript compilation failed - fix type errors before deployment"
fi

# ESLint
echo "Running ESLint..."
if pnpm lint 2>/dev/null; then
    pass "ESLint checks passed"
else
    warn "ESLint found issues - review before deployment"
fi

# =============================================================================
# SECTION 2: Build Test
# =============================================================================

section "2. Build Verification"

echo "Running production build..."
if pnpm build 2>/dev/null; then
    pass "Production build successful"
else
    fail "Production build failed - cannot deploy"
fi

# Check for build artifacts
if [ -d ".next" ]; then
    pass "Build artifacts generated (.next directory exists)"
else
    fail "Build artifacts missing - build may have failed silently"
fi

# =============================================================================
# SECTION 3: Compliance Checks
# =============================================================================

section "3. Compliance Verification"

# Compliance audit
echo "Running compliance audit..."
if node scripts/compliance-audit.js 2>/dev/null; then
    pass "Compliance audit passed"
else
    fail "Compliance audit failed - fix GDPR/security issues"
fi

# GDPR schema validation
echo "Running GDPR schema validation..."
if node scripts/gdpr-schema-check.js 2>/dev/null; then
    pass "GDPR schema validation passed"
else
    warn "GDPR schema validation has warnings - review"
fi

# =============================================================================
# SECTION 4: Environment Configuration
# =============================================================================

section "4. Environment Configuration"

# Check .env.local exists
if [ -f ".env.local" ]; then
    pass ".env.local file exists"
else
    fail ".env.local file missing - cannot deploy without configuration"
fi

# Check critical environment variables
if [ -n "$NEXTAUTH_SECRET" ]; then
    pass "NEXTAUTH_SECRET is set"
else
    fail "NEXTAUTH_SECRET is not set - authentication will fail"
fi

if [ -n "$NEXTAUTH_URL" ]; then
    pass "NEXTAUTH_URL is set: $NEXTAUTH_URL"
else
    warn "NEXTAUTH_URL is not set - may cause issues"
fi

if [ -n "$NEXT_PUBLIC_API_URL" ]; then
    pass "NEXT_PUBLIC_API_URL is set: $NEXT_PUBLIC_API_URL"
else
    fail "NEXT_PUBLIC_API_URL is not set - API calls will fail"
fi

if [ -n "$BITRIX24_WEBHOOK_SECRET" ]; then
    pass "BITRIX24_WEBHOOK_SECRET is set"
else
    warn "BITRIX24_WEBHOOK_SECRET is not set - webhook verification disabled"
fi

if [ -n "$ENCRYPTION_KEY" ]; then
    pass "ENCRYPTION_KEY is set (GDPR Article 32)"
else
    warn "ENCRYPTION_KEY is not set - file encryption disabled"
fi

# =============================================================================
# SECTION 5: Security Checks
# =============================================================================

section "5. Security Verification"

# Check .gitignore for .env.local
if grep -q ".env.local" .gitignore 2>/dev/null; then
    pass ".env.local is in .gitignore (secrets won't be committed)"
else
    fail ".env.local is NOT in .gitignore - RISK OF SECRET LEAK"
fi

# Check for hardcoded secrets
echo "Scanning for hardcoded secrets..."
if grep -r "password\s*=\s*['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process.env" | grep -v "//"; then
    fail "Potential hardcoded passwords found - review and remove"
else
    pass "No hardcoded passwords detected"
fi

if grep -r "secret\s*=\s*['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process.env" | grep -v "//"; then
    warn "Potential hardcoded secrets found - review"
else
    pass "No hardcoded secrets detected"
fi

# =============================================================================
# SECTION 6: GDPR Watermarks
# =============================================================================

section "6. GDPR Data Residency Enforcement"

# Check for CountryGuard in dashboard layout
if grep -r "CountryGuard" src/app/ --include="*.tsx" 2>/dev/null; then
    pass "CountryGuard found in application"
else
    warn "CountryGuard not found - GDPR residency may not be enforced"
fi

# Check for data residency mentions
if grep -r "Data Residency" src/components/ --include="*.tsx" 2>/dev/null; then
    pass "Data residency indicators present in components"
else
    warn "No data residency indicators found"
fi

# Check for GDPR Article references
if grep -r "Article 44\|GDPR" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    pass "GDPR Article references found in codebase"
else
    warn "No GDPR Article references found - compliance may be incomplete"
fi

# =============================================================================
# SECTION 7: Canon Law Workflow
# =============================================================================

section "7. Canon Law Compliance (CIC 1300-1307)"

# Check for CanonicalApproval component
if grep -r "CanonicalApproval" src/components/ --include="*.tsx" 2>/dev/null; then
    pass "CanonicalApproval component found"
else
    warn "CanonicalApproval component not found - Catholic entities cannot be approved"
fi

# Check for Canon Law references
if grep -r "Canon Law\|CIC 1300" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    pass "Canon Law references found in codebase"
else
    warn "No Canon Law references found"
fi

# =============================================================================
# SECTION 8: Bitrix24 Integration
# =============================================================================

section "8. Bitrix24 Integration"

# Check webhook route exists
if [ -f "src/app/api/bitrix24/webhook/route.ts" ]; then
    pass "Bitrix24 webhook route exists"
else
    warn "Bitrix24 webhook route not found - real-time sync disabled"
fi

# Check for signature verification
if grep -q "verifyBitrixSignature" src/app/api/bitrix24/webhook/route.ts 2>/dev/null; then
    pass "Webhook signature verification implemented"
else
    fail "Webhook signature verification NOT implemented - security risk"
fi

# Check for circuit breaker
if grep -q "circuitBreaker\|isSyncPaused" src/app/api/bitrix24/webhook/route.ts 2>/dev/null; then
    pass "Circuit breaker pattern implemented"
else
    warn "Circuit breaker not implemented - risk of cascade failures"
fi

# Check Bitrix24 connectivity (if configured)
if [ -n "$BITRIX24_DOMAIN" ]; then
    echo "Testing Bitrix24 connectivity to $BITRIX24_DOMAIN..."
    if curl -s -o /dev/null -w "%{http_code}" "https://$BITRIX24_DOMAIN" | grep -q "200\|301\|302"; then
        pass "Bitrix24 domain is reachable"
    else
        warn "Bitrix24 domain may not be reachable - check configuration"
    fi
else
    warn "BITRIX24_DOMAIN not set - skipping connectivity test"
fi

# =============================================================================
# SECTION 9: Feature Flags
# =============================================================================

section "9. Feature Flags Status"

# Check critical feature flags
if [ "$NEXT_PUBLIC_ENABLE_BITRIX_SYNC" = "true" ]; then
    pass "Bitrix24 sync is enabled"
else
    warn "Bitrix24 sync is disabled"
fi

if [ "$NEXT_PUBLIC_ENABLE_GDPR_MAP" = "true" ]; then
    pass "GDPR map visualization is enabled"
else
    warn "GDPR map visualization is disabled"
fi

if [ "$NEXT_PUBLIC_ENABLE_CANONICAL_WORKFLOW" = "true" ]; then
    pass "Canonical workflow is enabled"
else
    warn "Canonical workflow is disabled"
fi

if [ "$NEXT_PUBLIC_ENABLE_DEBUG_MODE" = "true" ]; then
    warn "Debug mode is enabled - DISABLE IN PRODUCTION"
else
    pass "Debug mode is disabled"
fi

if [ "$NEXT_PUBLIC_ENABLE_MOCK_DATA" = "true" ]; then
    warn "Mock data is enabled - DISABLE IN PRODUCTION"
else
    pass "Mock data is disabled"
fi

# =============================================================================
# SECTION 10: Dependencies
# =============================================================================

section "10. Dependencies"

# Check for security vulnerabilities
echo "Checking for known vulnerabilities in dependencies..."
if command -v pnpm &> /dev/null; then
    if pnpm audit --audit-level=high 2>/dev/null; then
        pass "No high-severity vulnerabilities found in dependencies"
    else
        warn "Vulnerabilities found in dependencies - run 'pnpm audit' for details"
    fi
else
    warn "pnpm not available for audit"
fi

# Check for outdated dependencies
echo "Checking for outdated dependencies..."
if command -v pnpm &> /dev/null; then
    OUTDATED=$(pnpm outdated 2>/dev/null | wc -l)
    if [ "$OUTDATED" -lt 5 ]; then
        pass "Dependencies are reasonably up-to-date"
    else
        warn "Several dependencies are outdated - consider updating"
    fi
fi

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}Pre-Deployment Summary${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${AMBER}Warnings: $WARNINGS${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}${BOLD}✗ $FAILED critical check(s) failed. Fix before deployment.${NC}"
    echo ""
    echo "Run the following commands to fix issues:"
    echo "  1. pnpm type-check    # Fix TypeScript errors"
    echo "  2. pnpm lint          # Fix linting issues"
    echo "  3. pnpm build         # Ensure build succeeds"
    echo "  4. pnpm compliance:check  # Fix compliance issues"
    echo ""
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${AMBER}${BOLD}⚠ $WARNINGS warning(s) found. Review before deployment.${NC}"
    echo ""
    echo "You may proceed with deployment, but review the warnings above."
    echo ""
    read -p "Proceed with deployment? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

echo -e "${GREEN}${BOLD}✓ All critical checks passed!${NC}"
echo ""
echo -e "${BOLD}Ready for deployment to:${NC}"
echo "  • Vercel: vercel --prod"
echo "  • Google Cloud: gcloud run deploy"
echo "  • Docker: docker build -t jol-hub/admin-dashboard ."
echo ""
echo -e "${BOLD}Post-deployment checklist:${NC}"
echo "  1. Verify health endpoint responds"
echo "  2. Test authentication flow"
echo "  3. Verify Bitrix24 webhook connectivity"
echo "  4. Check GDPR watermark visibility"
echo "  5. Monitor error logs for 10 minutes"
echo ""

exit 0
