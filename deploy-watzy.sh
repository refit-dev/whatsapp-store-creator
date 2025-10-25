#!/bin/bash

# Watzy Deployment Script for Vercel
# This script helps deploy watzy to Vercel with custom domain configuration

set -e

echo "🚀 Starting watzy deployment to Vercel..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    print_status "Checking Vercel CLI installation..."
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
        print_success "Vercel CLI installed successfully"
    else
        print_success "Vercel CLI is already installed"
    fi
}

# Login to Vercel
vercel_login() {
    print_status "Checking Vercel authentication..."
    if ! vercel whoami &> /dev/null; then
        print_warning "Not logged in to Vercel. Please login..."
        vercel login
    else
        print_success "Already logged in to Vercel"
    fi
}

# Deploy to Vercel
deploy_project() {
    print_status "Deploying watzy to Vercel..."
    
    # Deploy with production flag
    vercel --prod --yes
    
    print_success "Deployment completed!"
}

# Configure custom domain
configure_domain() {
    print_status "Configuring custom domain watzy.app..."
    
    # Add primary domain
    vercel domains add watzy.app 2>/dev/null || print_warning "Domain watzy.app might already be added"
    
    # Add www subdomain
    vercel domains add www.watzy.app 2>/dev/null || print_warning "Domain www.watzy.app might already be added"
    
    print_success "Domain configuration completed!"
    print_warning "Please update your DNS settings:"
    echo "  A Record:    @ → 76.76.19.19"
    echo "  CNAME Record: www → cname.vercel-dns.com"
}

# Set environment variables
setup_env_vars() {
    print_status "Environment variables setup..."
    print_warning "Please manually add the following environment variables in Vercel dashboard:"
    echo ""
    echo "Required Environment Variables:"
    echo "- NEXT_PUBLIC_SUPABASE_URL"
    echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "- SUPABASE_SERVICE_ROLE_KEY"
    echo "- RAZORPAY_KEY_ID"
    echo "- RAZORPAY_KEY_SECRET"
    echo "- NEXT_PUBLIC_RAZORPAY_KEY_ID"
    echo "- NEXT_PUBLIC_APP_URL (set to https://watzy.app)"
    echo ""
    echo "Visit: https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Get the deployment URL
    DEPLOYMENT_URL=$(vercel --scope $(vercel whoami) list | grep watzy | head -1 | awk '{print $2}')
    
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        print_success "Deployment URL: https://$DEPLOYMENT_URL"
        print_status "Testing deployment..."
        
        # Test if the site is responding
        if curl -s --head https://$DEPLOYMENT_URL | head -n 1 | grep -q "200 OK"; then
            print_success "Site is responding correctly!"
        else
            print_warning "Site might still be deploying or there's an issue"
        fi
    else
        print_warning "Could not determine deployment URL"
    fi
}

# Update external services
update_external_services() {
    print_status "External services update needed..."
    print_warning "Please update the following services manually:"
    echo ""
    echo "1. Supabase Authentication Settings:"
    echo "   - Site URL: https://watzy.app"
    echo "   - Redirect URLs: https://watzy.app/auth/callback, https://www.watzy.app/auth/callback"
    echo ""
    echo "2. Razorpay Settings:"
    echo "   - Website URL: https://watzy.app"
    echo "   - Webhook URL: https://watzy.app/api/razorpay/webhook"
    echo ""
}

# Main deployment flow
main() {
    echo "=========================================="
    echo "🌟 Watzy Vercel Deployment Script"
    echo "=========================================="
    
    check_vercel_cli
    vercel_login
    deploy_project
    configure_domain
    setup_env_vars
    verify_deployment
    update_external_services
    
    echo ""
    echo "=========================================="
    print_success "Deployment process completed!"
    echo "=========================================="
    echo ""
    print_status "Next steps:"
    echo "1. Add environment variables in Vercel dashboard"
    echo "2. Update DNS settings for watzy.app"
    echo "3. Update Supabase and Razorpay configurations"
    echo "4. Test all functionality on https://watzy.app"
    echo ""
    print_success "Your watzy platform should be live at https://watzy.app within 24-48 hours!"
}

# Run the deployment
main