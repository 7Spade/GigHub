# Supabase MCP Quick Start Guide

> **TL;DR**: Your Supabase MCP tools are configured but need GitHub Secrets to connect to remote database.

---

## 🚀 Quick Fix (3 Steps)

### 1. Get Your Supabase Info

Visit [Supabase Dashboard](https://supabase.com/dashboard) and get:

**A. Project Reference ID**:
```
From URL: https://YOUR-PROJECT-REF.supabase.co
                  ↑
Example: zecsbstjqjqoytwgjyct
```

**B. Access Token**:
- Go to **Settings** → **API**
- Copy **service_role** key (for dev/testing)
- OR generate dedicated MCP token (for production)

---

### 2. Add GitHub Secrets

Go to: `https://github.com/7Spade/GigHub/settings/secrets/actions`

Add two secrets:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_PROJECT_REF` | Your project reference ID |
| `SUPABASE_MCP_TOKEN` | Your access token |

---

### 3. Test Connection

Restart Copilot session and try:

```
List all tables in the Supabase database using MCP tools
```

**Expected Output**: List of tables from your remote database

---

## 📊 Current Status

### ✅ Working
- [x] Supabase MCP server configured (`.github/copilot/mcp-servers.yml`)
- [x] 20 MCP tools installed and functional
- [x] Documentation search working

### ⏳ Pending
- [ ] `SUPABASE_PROJECT_REF` secret (required for remote connection)
- [ ] `SUPABASE_MCP_TOKEN` secret (required for authentication)

---

## 🔧 Available Tools

Once configured, you can use:

| Tool | Purpose |
|------|---------|
| `list_tables` | List database tables |
| `execute_sql` | Run SQL queries |
| `apply_migration` | Apply database migrations |
| `create_branch` | Create development branches |
| `deploy_edge_function` | Deploy Edge Functions |
| `get_logs` | Fetch service logs |
| `get_advisors` | Security & performance checks |
| ...and 13 more | See full list in setup guide |

---

## 🐛 Troubleshooting

**Problem**: Tools not connecting?

**Check**:
1. Secrets added correctly?
2. Project REF format correct? (no full URL)
3. Token valid and not expired?

**Test Command**:
```
Use Supabase MCP get_project_url tool to check project status
```

---

## 📚 Full Documentation

For detailed setup instructions, see:
- [Complete Setup Guide](./.github/SUPABASE_MCP_SETUP.md)
- [MCP Tools Usage Guide](./.github/MCP_TOOLS_USAGE_GUIDE.md)

---

## 🎯 What You'll Get

After configuration:

✅ Query remote database directly from Copilot  
✅ Manage migrations and schema changes  
✅ Deploy and manage Edge Functions  
✅ Create and merge development branches  
✅ Access logs and diagnostics  
✅ Run security and performance audits  

---

**Questions?** Open an issue on GitHub or check the full setup guide.
