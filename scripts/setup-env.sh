#!/bin/bash

# =============================================
# GigHub Environment Setup Script
# 工地施工進度追蹤管理系統環境配置腳本
# =============================================
# Description: Interactive script to set up .env file
# Created: 2025-12-12
# Author: GigHub Development Team
# =============================================

set -e

echo "🚀 GigHub Environment Setup"
echo "================================"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

echo "📝 Please provide your Supabase credentials:"
echo ""

# Prompt for Supabase URL
read -p "Supabase URL (e.g., https://xxx.supabase.co): " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Supabase URL is required!"
    exit 1
fi

# Prompt for Anon Key
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Supabase Anon Key is required!"
    exit 1
fi

# Optional: Service Role Key
read -p "Supabase Service Role Key (optional, press Enter to skip): " SUPABASE_SERVICE_ROLE_KEY

# Optional: JWT Secret
read -p "Supabase JWT Secret (optional, press Enter to skip): " SUPABASE_JWT_SECRET

# Optional: PostgreSQL credentials
read -p "PostgreSQL Host (optional, press Enter to skip): " POSTGRES_HOST
read -p "PostgreSQL Password (optional, press Enter to skip): " POSTGRES_PASSWORD

echo ""
echo "📄 Creating .env file..."

# Create .env file
cat > .env << EOF
# Supabase Configuration
# Generated: $(date +"%Y-%m-%d %H:%M:%S")
# Environment: Development

# Angular Public Keys (prefix with NG_PUBLIC_ for Angular)
NG_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NG_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"

# Supabase Keys
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
EOF

# Add optional fields if provided
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "SUPABASE_SERVICE_ROLE_KEY=\"${SUPABASE_SERVICE_ROLE_KEY}\"" >> .env
fi

if [ -n "$SUPABASE_JWT_SECRET" ]; then
    echo "SUPABASE_JWT_SECRET=\"${SUPABASE_JWT_SECRET}\"" >> .env
fi

if [ -n "$POSTGRES_HOST" ]; then
    cat >> .env << EOF

# PostgreSQL Configuration
POSTGRES_HOST="${POSTGRES_HOST}"
POSTGRES_DATABASE="postgres"
POSTGRES_USER="postgres"
EOF
fi

if [ -n "$POSTGRES_PASSWORD" ]; then
    echo "POSTGRES_PASSWORD=\"${POSTGRES_PASSWORD}\"" >> .env
fi

echo "✅ .env file created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Review the .env file and add any missing credentials"
echo "2. Run database initialization script:"
echo "   - Go to Supabase Dashboard > SQL Editor"
echo "   - Run: docs/database/init_schema.sql"
echo "3. Create storage bucket 'construction-photos' in Supabase Dashboard"
echo "4. Start the development server: yarn start"
echo ""
echo "📖 For more information, see: docs/database/README.md"
echo ""
echo "🎉 Setup complete!"
