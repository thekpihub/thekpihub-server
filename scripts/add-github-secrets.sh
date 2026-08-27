#!/bin/bash

################################################################################
# GitHub Actions Secrets Setup Script
#
# Purpose: Interactively add required GitHub Actions secrets
#
# Usage:   ./scripts/add-github-secrets.sh
#
# Prerequisites:
#  - GitHub CLI (gh) installed and authenticated
#  - Repository push access
#
# This script will prompt for each secret and add it to the repository
################################################################################

set -e

# Configuration
REPO="hsharmagxi-debug/kpihub-assembled"
SECRETS=("VERCEL_TOKEN" "VERCEL_ORG_ID" "VERCEL_PROJECT_ID")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}\n"
}

print_step() {
    echo -e "${CYAN}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

prompt_for_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_value=""

    echo ""
    echo -e "${YELLOW}Enter $secret_name${NC}"
    echo "Description: $secret_description"
    echo ""
    echo -e "${YELLOW}Where to find it:${NC}"

    case $secret_name in
        VERCEL_TOKEN)
            echo "1. Go to: https://vercel.com/account/tokens"
            echo "2. Click 'Create' button"
            echo "3. Name: GitHub Actions KPI Hub"
            echo "4. Scope: Full Access"
            echo "5. Copy the token (long alphanumeric string)"
            ;;
        VERCEL_ORG_ID)
            echo "1. Go to: https://vercel.com/account/general"
            echo "2. Find 'Team ID' section"
            echo "3. Copy the ID (starts with 'team_')"
            echo ""
            echo "   OR if you don't have a team:"
            echo "   Use your Personal Account ID"
            ;;
        VERCEL_PROJECT_ID)
            echo "1. Go to: https://vercel.com/projects/kpihub-platform"
            echo "2. Click 'Settings' tab"
            echo "3. Find 'Project ID' section"
            echo "4. Copy the ID (starts with 'prj_')"
            ;;
    esac

    echo ""
    echo -n "Paste your ${secret_name} and press Enter: "
    read -r secret_value

    # Validate input
    if [ -z "$secret_value" ]; then
        print_error "Secret value cannot be empty"
        return 1
    fi

    # Trim whitespace
    secret_value=$(echo "$secret_value" | xargs)

    # Confirm
    echo ""
    echo -e "${YELLOW}Value entered:${NC}"
    echo "  Length: ${#secret_value} characters"
    echo "  First 10 chars: ${secret_value:0:10}..."
    echo ""
    echo -n "Is this correct? (y/n): "
    read -r confirm

    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_warning "Cancelled. Please try again."
        return 1
    fi

    echo "$secret_value"
    return 0
}

add_secret() {
    local secret_name=$1
    local secret_value=$2

    print_step "Adding $secret_name to GitHub..."

    if gh secret set "$secret_name" \
        --body "$secret_value" \
        --repo "$REPO" 2>/dev/null; then
        print_success "Secret $secret_name added successfully"
        return 0
    else
        print_error "Failed to add secret $secret_name"
        print_info "Make sure you have push access to the repository"
        return 1
    fi
}

verify_secrets() {
    print_header "Verifying Secrets"

    print_step "Listing all secrets in repository..."
    echo ""

    if gh secret list --repo "$REPO"; then
        echo ""
        print_success "All secrets listed successfully"
        return 0
    else
        print_error "Failed to list secrets"
        return 1
    fi
}

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check GitHub CLI
    print_step "Checking GitHub CLI installation..."
    if command -v gh &> /dev/null; then
        print_success "GitHub CLI installed"
    else
        print_error "GitHub CLI not found"
        echo "Please install it from: https://cli.github.com/"
        return 1
    fi

    # Check authentication
    print_step "Checking GitHub authentication..."
    if gh auth status &>/dev/null; then
        print_success "GitHub CLI authenticated"
    else
        print_error "GitHub CLI not authenticated"
        echo "Run: gh auth login"
        return 1
    fi

    # Check repository access
    print_step "Checking repository access..."
    if gh repo view "$REPO" &>/dev/null; then
        print_success "Repository accessible: $REPO"
    else
        print_error "Cannot access repository: $REPO"
        return 1
    fi

    echo ""
    return 0
}

show_instructions() {
    print_header "Before You Start"

    echo "This script will add the following secrets to GitHub:"
    echo ""
    echo "  1. VERCEL_TOKEN - Your Vercel authentication token"
    echo "  2. VERCEL_ORG_ID - Your Vercel organization/team ID"
    echo "  3. VERCEL_PROJECT_ID - Your Vercel project identifier"
    echo ""
    echo -e "${YELLOW}Important:${NC}"
    echo "  • You need accounts/access for Vercel and GitHub"
    echo "  • Have admin access to the GitHub repository"
    echo "  • The Vercel project 'kpihub-platform' must exist"
    echo "  • Tokens cannot be viewed after creation, so copy carefully"
    echo ""
    echo "Time required: ~5-10 minutes"
    echo ""
    echo -n "Ready to proceed? (y/n): "
    read -r proceed

    if [ "$proceed" != "y" ] && [ "$proceed" != "Y" ]; then
        print_warning "Setup cancelled."
        return 1
    fi

    echo ""
    return 0
}

show_summary() {
    print_header "Setup Complete"

    echo -e "${GREEN}✓ All secrets have been added to GitHub!${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Verify secrets in GitHub:"
    echo "   https://github.com/$REPO/settings/secrets/actions"
    echo ""
    echo "2. Run validation script:"
    echo "   ./scripts/validate-github-secrets.sh"
    echo ""
    echo "3. Test deployment (Phase C Step 2):"
    echo "   Create and push a test commit to main branch"
    echo ""
    echo "4. Monitor deployment:"
    echo "   GitHub Actions: https://github.com/$REPO/actions"
    echo "   Vercel: https://vercel.com/projects/kpihub-platform/deployments"
    echo ""
    echo "For more information, see:"
    echo "   PHASE-C-GITHUB-SECRETS-SETUP.md"
    echo "   PHASE-C-QUICK-REFERENCE.md"
}

################################################################################
# Main Execution
################################################################################

main() {
    # Print welcome banner
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║     GitHub Actions Secrets Setup                       ║"
    echo "║     Phase C - KPI Hub Platform CI/CD                  ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Check prerequisites
    if ! check_prerequisites; then
        print_error "Prerequisites check failed. Please fix the issues above."
        return 1
    fi

    # Show instructions
    if ! show_instructions; then
        return 1
    fi

    # Add each secret
    local all_success=true
    for secret_name in "${SECRETS[@]}"; do
        case $secret_name in
            VERCEL_TOKEN)
                local description="Authentication token for Vercel API"
                ;;
            VERCEL_ORG_ID)
                local description="Organization/Team ID from Vercel"
                ;;
            VERCEL_PROJECT_ID)
                local description="Project ID from Vercel project settings"
                ;;
        esac

        # Prompt for secret value
        local secret_value
        if ! secret_value=$(prompt_for_secret "$secret_name" "$description"); then
            all_success=false
            continue
        fi

        # Add secret to GitHub
        if ! add_secret "$secret_name" "$secret_value"; then
            all_success=false
            continue
        fi

        sleep 1  # Brief pause between secrets
    done

    echo ""

    # Verify all secrets were added
    if ! verify_secrets; then
        all_success=false
    fi

    # Show summary
    if [ "$all_success" = true ]; then
        show_summary
        return 0
    else
        print_error "Some secrets failed to be added. Please try again."
        return 1
    fi
}

# Run main function
main "$@"
exit $?
