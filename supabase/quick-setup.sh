#!/bin/bash

# =====================================================
# Construction Logs Quick Setup Script
# 工地日誌快速設定腳本
# =====================================================
#
# 此腳本用於快速在 Supabase 建立 construction_logs 表格
#
# 使用方式:
#   chmod +x quick-setup.sh
#   ./quick-setup.sh
#
# 或直接執行:
#   bash quick-setup.sh
#
# =====================================================

set -e  # 遇到錯誤立即停止

echo "🚀 Construction Logs Setup Script"
echo "=================================="
echo ""

# 檢查 psql 是否安裝
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql not found"
    echo "Please install PostgreSQL client first:"
    echo "  - Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  - macOS: brew install postgresql"
    echo "  - Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Supabase 連線資訊
export PGHOST="db.zecsbstjqjqoytwgjyct.supabase.co"
export PGPORT="5432"
export PGUSER="postgres"
export PGPASSWORD="IBXgJ6mxLrlQxNEm"
export PGDATABASE="postgres"

echo "📊 Connecting to Supabase database..."
echo "   Host: $PGHOST"
echo ""

# 測試連線
if ! psql -c "SELECT version();" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database"
    echo ""
    echo "Possible reasons:"
    echo "  1. Network connection issue"
    echo "  2. Incorrect credentials"
    echo "  3. Firewall blocking connection"
    echo ""
    echo "📝 Alternative: Use Supabase Dashboard"
    echo "   1. Go to https://supabase.com/dashboard"
    echo "   2. Open SQL Editor"
    echo "   3. Copy content from: supabase/construction_logs.sql"
    echo "   4. Execute the SQL"
    exit 1
fi

echo "✅ Connection successful!"
echo ""

# 執行 SQL 腳本
echo "📝 Executing construction_logs.sql..."
if psql -f "$(dirname "$0")/construction_logs.sql"; then
    echo "✅ SQL executed successfully!"
else
    echo "❌ Error: Failed to execute SQL"
    exit 1
fi

echo ""
echo "🔍 Verifying installation..."
echo ""

# 驗證表格
TABLE_COUNT=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'construction_logs';")
if [ "$TABLE_COUNT" -eq 1 ]; then
    echo "✅ Table 'construction_logs' created"
else
    echo "❌ Table 'construction_logs' not found"
fi

# 驗證 RLS
RLS_STATUS=$(psql -t -c "SELECT rowsecurity FROM pg_tables WHERE tablename = 'construction_logs';")
if [[ "$RLS_STATUS" == *"t"* ]]; then
    echo "✅ Row Level Security enabled"
else
    echo "⚠️  Row Level Security not enabled"
fi

# 驗證政策
POLICY_COUNT=$(psql -t -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'construction_logs';")
POLICY_COUNT=$(echo $POLICY_COUNT | xargs)  # 去除空白
echo "✅ RLS Policies created: $POLICY_COUNT (expected: 4)"

# 驗證索引
INDEX_COUNT=$(psql -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'construction_logs';")
INDEX_COUNT=$(echo $INDEX_COUNT | xargs)
echo "✅ Indexes created: $INDEX_COUNT (expected: 5)"

echo ""
echo "=================================="
echo "🎉 Setup completed successfully!"
echo "=================================="
echo ""
echo "⚠️  IMPORTANT: Manual step required"
echo "   You still need to create Storage Bucket manually:"
echo ""
echo "   1. Go to Supabase Dashboard → Storage"
echo "   2. Click 'New bucket'"
echo "   3. Name: construction-photos"
echo "   4. Public bucket: ✅ Check this"
echo "   5. Click 'Create bucket'"
echo ""
echo "📝 Next steps:"
echo "   1. Create storage bucket (see above)"
echo "   2. Start the app: yarn start"
echo "   3. Test construction logs feature"
echo ""
