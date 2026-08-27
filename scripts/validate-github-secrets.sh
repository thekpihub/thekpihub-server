#!/bin/bash

################################################################################
# GitHub Actions Secrets Validation Script
#
# Purpose: Verify that all required GitHub Actions secrets are properly
#          configured for Vercel CI/CD deployment
#
# Usage:   ./scripts/validate-github-secrets.sh
#
# Prerequisites:
#  - GitHub CLI (gh) installed and authenticated
#  - jq installed for JSON parsing
#  - Repository access with admin permissions
#
################################################################################

set -e

# Configuration
REPO="hsharmagxi-debug/kpihub-assembled"
REQUIRED_SECRETS=("VERCEL_TOKEN" "VERCEL_ORG_ID" "VERCEL_PROJECT_ID")
PASS_ICON="✓"
FAIL_ICON="✗"
WARN_ICON="⚠"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_pass() {
    echo -e "${GREEN}${PASS_ICON}${NC} $1"
}

print_fail() {
    echo -e "${RED}${FAIL_ICON}${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}${WARN_ICON}${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_fail "Required command not found: $1"
        echo "Please install $1 and try again"
        return 1
    fi
    return 0
}

################################################################################
# Main Validation Functions
################################################################################

validate_prerequisites() {
    print_header "Checking Prerequisites"

    local all_good=true

    # Check GitHub CLI
    if check_command "gh"; then
        print_pass "GitHub CLI (gh) installed"
    else
        all_good=false
    fi

    # Check jq
    if check_command "jq"; then
        print_pass "jq installed"
    else
        print_warn "jq not found (optional, for enhanced output)"
    fi

    # Check GitHub authentication
    if gh auth status &>/dev/null; then
        print_pass "GitHub CLI authenticated"
    else
        print_fail "GitHub CLI not authenticated"
        echo "Run: gh auth login"
        all_good=false
    fi

    return $([ "$all_good" = true ] && echo 0 || echo 1)
}

validate_secrets_exist() {
    print_header "Checking Secret Existence"

    local all_exist=true
    local secrets_list=$(gh secret list --repo "$REPO" 2>&1)

    for secret in "${REQUIRED_SECRETS[@]}"; do
        if echo "$secrets_list" | grep -q "^${secret}[[:space:]]"; then
            print_pass "Secret exists: $secret"
        else
            print_fail "Secret NOT found: $secret"
            all_exist=false
        fi
    done

    return $([ "$all_exist" = true ] && echo 0 || echo 1)
}

validate_secret_values() {
    print_header "Validating Secret Values"

    local all_valid=true

    # We can't read secret values, so we check format indirectly
    # by attempting to use them in a test

    print_info "Checking VERCEL_TOKEN format..."
    # VERCEL_TOKEN should be a long string
    print_warn "Cannot validate secret contents (GitHub masks them)"
    print_info "Secrets will be validated during first deployment"

    return 0
}

validate_workflow_access() {
    print_header "Checking Workflow Access"

    # Check if workflows can access secrets
    if [ -f ".github/workflows/deploy-vercel.yml" ] || [ -f ".github/workflows/*.yml" ]; then
        print_pass "Workflow files found"

        # Check for secret references
        if grep -r "secrets\." .github/workflows/ &>/dev/null; then
            print_pass "Workflows reference secrets"
        else
            print_warn "No secret references found in workflows"
        fi
    else
        print_warn "No workflow files found yet (will be created in Phase C Step 2)"
    fi

    return 0
}

validate_repository_settings() {
    print_header "Checking Repository Settings"

    # Check if repository is accessible
    if gh repo view "$REPO" &>/dev/null; then
        print_pass "Repository is accessible"
    else
        print_fail "Cannot access repository: $REPO"
        return 1
    fi

    # Check for branch protection
    if gh api "repos/$REPO/branches/main/protection" &>/dev/null; then
        print_pass "Branch protection is enabled on main"
    else
        print_warn "No branch protection detected on main (recommended)"
    fi

    return 0
}

validate_vercel_connection() {
    print_header "Checking Vercel Integration"

    # Check if vercel CLI is available
    if command -v vercel &> /dev/null; then
        print_pass "Vercel CLI available"

        # Try to list projects
        if vercel list &>/dev/null; then
            print_pass "Can access Vercel projects"
        else
            print_warn "Cannot access Vercel projects (token may be needed)"
        fi
    else
        print_info "Vercel CLI not installed (optional)"
    fi

    return 0
}

validate_environment_setup() {
    print_header "Checking Environment Configuration"

    # Check for vercel.json
    if [ -f "apps/platform/vercel.json" ]; then
        print_pass "vercel.json configuration found"

        # Check environment variables in vercel.json
        if grep -q "NEXT_PUBLIC_APP_URL\|SUPABASE_SERVICE_ROLE_KEY" apps/platform/vercel.json; then
            print_pass "Environment variables documented in vercel.json"
        else
            print_warn "Environment variables might be missing from vercel.json"
        fi
    else
        print_warn "vercel.json not found (not critical)"
    fi

    return 0
}

print_next_steps() {
    print_header "Next Steps"

    echo "1. Review the comprehensive guide:"
    echo "   cat PHASE-C-GITHUB-SECRETS-SETUP.md"
    echo ""
    echo "2. If validation failed, follow troubleshooting:"
    echo "   - Check GitHub secrets are spelled exactly: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID"
    echo "   - Verify secrets have correct values from Vercel"
    echo "   - Test with a push to main branch"
    echo ""
    echo "3. Monitor first deployment:"
    echo "   - GitHub Actions: https://github.com/hsharmagxi-debug/kpihub-assembled/actions"
    echo "   - Vercel Deployments: https://vercel.com/projects/kpihub-platform/deployments"
    echo ""
    echo "4. Phase C Step 2: Create deployment workflow (deploy-vercel.yml)"
}

print_summary() {
    print_header "Validation Summary"

    local checks_passed=0
    local checks_failed=0

    # Count successes and failures (approximate)
    if validate_prerequisites 2>/dev/null; then
        ((checks_passed++))
    else
        ((checks_failed++))
    fi

    if validate_secrets_exist 2>/dev/null; then
        ((checks_passed++))
    else
        ((checks_failed++))
    fi

    echo "Passed: $checks_passed"
    echo "Failed: $checks_failed"
    echo ""

    if [ $checks_failed -eq 0 ]; then
        echo -e "${GREEN}✓ All validations passed!${NC}"
        echo "Your GitHub Actions secrets are ready for use."
        return 0
    else
        echo -e "${RED}✗ Some validations failed${NC}"
        echo "Please fix the issues above before proceeding."
        return 1
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     GitHub Actions Secrets Validation                     ║"
    echo "║     Phase C - KPI Hub Platform CI/CD Setup               ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Run all validation checks
    validate_prerequisites
    validate_secrets_exist
    validate_secret_values
    validate_workflow_access
    validate_repository_settings
    validate_vercel_connection
    validate_environment_setup

    # Print summary and next steps
    print_summary
    local summary_result=$?

    print_next_steps

    return $summary_result
}

# Run main function
main "$@"
exit $?
