# .github Directory Documentation

Welcome to the GigHub project's GitHub configuration and Copilot setup documentation.

## 📚 Quick Navigation

### 🚀 Getting Started

**New User?** Start here based on your role:

| Role | Document | Description |
|------|----------|-------------|
| **Repository Admin** | [copilot-setup-steps.yml](copilot-setup-steps.yml) | Complete setup guide for configuring GitHub Secrets and MCP servers |
| **Developer** | [COPILOT_MCP_QUICKSTART.md](COPILOT_MCP_QUICKSTART.md) | 5-minute quick start guide for developers |
| **AI Agent** | [copilot-instructions.md](copilot-instructions.md) | Main instructions for GitHub Copilot |

### 🎯 Key Documents

#### Setup & Configuration
- **[copilot-setup-steps.yml](copilot-setup-steps.yml)** ⭐ - Complete MCP setup guide
  - How to configure GitHub Actions Secrets
  - Step-by-step MCP server configuration
  - Security best practices
  - Troubleshooting guide
  - FAQ

- **[COPILOT_MCP_QUICKSTART.md](COPILOT_MCP_QUICKSTART.md)** ⚡ - 5-minute quick start
  - Quick checklist for admins
  - Quick checklist for developers
  - Common issues and solutions

- **[COPILOT_SETUP.md](COPILOT_SETUP.md)** - Copilot configuration overview
  - Directory structure
  - MCP tools overview
  - Development standards
  - Custom agents

#### Usage & Best Practices
- **[MCP_TOOLS_USAGE_GUIDE.md](MCP_TOOLS_USAGE_GUIDE.md)** - MCP tools usage guide
  - How to ensure Copilot uses tools
  - Memory management
  - Tool effectiveness validation
  - Best practices

- **[copilot-instructions.md](copilot-instructions.md)** - Main Copilot instructions
  - Project overview
  - Mandatory tool usage policy
  - Code standards
  - Integration patterns

#### Quick Reference
- **[instructions/quick-reference.instructions.md](instructions/quick-reference.instructions.md)** - Quick reference guide
  - Angular 20 modern syntax
  - ng-alain common components
  - Supabase data access patterns
  - Anti-patterns to avoid

- **[copilot/shortcuts/chat-shortcuts.md](copilot/shortcuts/chat-shortcuts.md)** - Chat shortcuts
  - `/gighub-component` - Generate components
  - `/gighub-service` - Generate services
  - `/gighub-repository` - Generate repositories
  - `/gighub-store` - Generate stores
  - `/gighub-review` - Review code
  - `/gighub-refactor` - Refactor code

#### Validation & Constraints
- **[copilot/SETUP_VALIDATION.md](copilot/SETUP_VALIDATION.md)** - Setup validation checklist
- **[copilot/constraints.md](copilot/constraints.md)** - Forbidden patterns and constraints
- **[copilot/security-rules.yml](copilot/security-rules.yml)** - Security rules configuration

## 🗂️ Directory Structure

```
.github/
├── README.md                              # This file
├── copilot-setup-steps.yml               # ⭐ Complete MCP setup guide
├── COPILOT_MCP_QUICKSTART.md             # ⚡ 5-minute quick start
├── COPILOT_SETUP.md                      # Copilot configuration overview
├── MCP_TOOLS_USAGE_GUIDE.md              # MCP tools usage guide
├── copilot-instructions.md               # Main Copilot instructions
│
├── copilot/                              # Copilot configuration
│   ├── README.md                         # Copilot directory overview
│   ├── mcp-servers.yml                   # MCP servers configuration
│   ├── security-rules.yml                # Security rules
│   ├── constraints.md                    # Code constraints
│   ├── SETUP_VALIDATION.md               # Validation checklist
│   ├── memory.jsonl                      # Project knowledge base
│   ├── store_memory.jsonl                # Additional memory
│   ├── agents/                           # Custom agents
│   │   ├── auto-triggers.yml             # Auto-trigger rules
│   │   └── config.yml                    # Agent configuration
│   ├── shortcuts/                        # Chat shortcuts
│   │   └── chat-shortcuts.md             # Shortcut definitions
│   └── workflows/                        # Common workflows
│       ├── new-module.workflow.md        # Module creation
│       ├── release-check.workflow.md     # Release validation
│       └── rls-check.workflow.md         # RLS policy validation
│
├── instructions/                         # Scoped instructions
│   ├── quick-reference.instructions.md   # Quick reference
│   ├── angular.instructions.md           # Angular 20 guidelines
│   ├── angular-modern-features.instructions.md  # Modern Angular features
│   ├── typescript-5-es2022.instructions.md      # TypeScript standards
│   ├── ng-alain-delon.instructions.md    # ng-alain framework
│   ├── ng-zorro-antd.instructions.md     # ng-zorro-antd components
│   ├── enterprise-angular-architecture.instructions.md  # Architecture patterns
│   ├── sql-sp-generation.instructions.md # SQL guidelines
│   └── memory-bank.instructions.md       # Documentation patterns
│
├── agents/                               # Custom agent definitions
│   ├── GigHub.agent.md                   # Main project agent
│   ├── context7.agent.md                 # Context7 documentation expert
│   ├── supabase.agent.md                 # Supabase database expert
│   ├── api-architect.agent.md            # API design expert
│   ├── arch.agent.md                     # Architecture expert
│   └── ... (16+ specialized agents)
│
└── workflows/                            # GitHub Actions workflows
    ├── ci.yml                            # CI pipeline
    └── deploy-site.yml                   # Deployment workflow
```

## 🎯 Common Tasks

### For Repository Admins

#### 1. Initial Setup
```bash
# Read the complete setup guide
cat .github/copilot-setup-steps.yml

# Create GitHub Secrets at:
# https://github.com/7Spade/GigHub/settings/secrets/actions
# Required secrets:
# - COPILOT_MCP_CONTEXT7
# - SUPABASE_PROJECT_REF
# - SUPABASE_MCP_TOKEN

# Validate configuration
python3 -c "import yaml; yaml.safe_load(open('.github/copilot/mcp-servers.yml')); print('✅ YAML valid')"
```

#### 2. Provide API Keys to Developers
Share the following with your development team:
- Context7 API Key (same as COPILOT_MCP_CONTEXT7)
- Supabase Project Ref (same as SUPABASE_PROJECT_REF)
- Supabase MCP Token (same as SUPABASE_MCP_TOKEN)

#### 3. Maintenance
```bash
# Monthly tasks:
# - Review and rotate API keys
# - Update documentation
# - Check tool usage analytics

# Quarterly tasks:
# - Audit access permissions
# - Update security policies
# - Review and update instruction files
```

### For Developers

#### 1. Quick Setup (5 minutes)
```bash
# Read quick start guide
cat .github/COPILOT_MCP_QUICKSTART.md

# Steps:
# 1. Get API keys from admin
# 2. Go to: https://github.com/settings/copilot
# 3. Enable Copilot Agent
# 4. Add Context7 MCP server
# 5. Add Supabase MCP server
# 6. Test with: "使用 context7 查詢 Angular 20 signal()"
```

#### 2. Daily Usage
```bash
# Use chat shortcuts for common tasks
/gighub-component     # Generate component
/gighub-service       # Generate service
/gighub-repository    # Generate repository
/gighub-store         # Generate store
/gighub-review        # Review code
/gighub-refactor      # Refactor code

# Explicitly request tool usage
"使用 context7 查詢 ng-alain ST table 的最新用法"
"使用 sequential-thinking 分析這個架構問題"
"使用 software-planning-tool 規劃這個功能"
```

#### 3. Best Practices
- Always use SHARED_IMPORTS for common modules
- Use Signals for component state
- Use inject() for dependency injection
- Follow Angular 20 modern patterns
- Check [quick-reference.instructions.md](instructions/quick-reference.instructions.md) for common patterns

## 🔧 MCP Servers Configuration

### Configured MCP Servers

| Server | Type | Purpose | Required Secrets |
|--------|------|---------|------------------|
| **context7** | HTTP | Query latest library documentation | COPILOT_MCP_CONTEXT7 |
| **supabase** | HTTP | Database operations | SUPABASE_PROJECT_REF, SUPABASE_MCP_TOKEN |
| **sequential-thinking** | Local | Structured reasoning | None |
| **software-planning-tool** | Local | Feature planning | None |
| **filesystem** | Local | File operations | None |
| **everything** | Local | General utilities | None |

### Configuration File

See [.github/copilot/mcp-servers.yml](copilot/mcp-servers.yml) for the complete configuration.

## 📖 Technology Stack

### Frontend
- **Angular**: 20.3.x (Standalone Components, Signals)
- **ng-alain**: 20.1.x (Admin framework)
- **ng-zorro-antd**: 20.3.x (UI component library)
- **TypeScript**: 5.9.x (Strict mode)
- **RxJS**: 7.8.x (Reactive programming)

### Backend
- **Supabase**: 2.86.x (Primary backend)
- **PostgreSQL**: via Supabase

### Build Tools
- **Angular CLI**: 20.3.x
- **Yarn**: 4.9.2 (Package manager)

## 🎓 Learning Resources

### Official Documentation
- [GitHub Copilot Documentation](https://docs.github.com/copilot)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Angular Documentation](https://angular.dev)
- [ng-alain Documentation](https://ng-alain.com)
- [Supabase Documentation](https://supabase.com/docs)

### Project-Specific Guides
- [Quick Reference Guide](instructions/quick-reference.instructions.md)
- [Angular Modern Features](instructions/angular-modern-features.instructions.md)
- [Enterprise Architecture](instructions/enterprise-angular-architecture.instructions.md)

## 🚨 Troubleshooting

### Copilot Not Using MCP Tools?

**Solution 1**: Explicitly request tool usage
```
"使用 context7 查詢 Angular 20 Signals"
```

**Solution 2**: Use chat shortcuts
```
/gighub-component
```

**Solution 3**: Remind Copilot
```
"請遵循 MANDATORY 工具使用政策，重新回答"
```

### MCP Server Connection Issues?

**Check 1**: Verify API keys are correct
- Go to: https://github.com/settings/copilot
- Check MCP server configuration
- Ensure API keys match those from admin

**Check 2**: Test MCP server connectivity
```bash
# Test Context7
curl -H "CONTEXT7_API_KEY: your-key" https://mcp.context7.com/mcp

# Test Supabase
curl -H "Authorization: Bearer your-token" \
  "https://mcp.supabase.com/mcp?project_ref=your-ref"
```

**Check 3**: Review logs
- Check GitHub Copilot logs in VS Code
- Look for MCP-related errors

### More Help?

1. **Check FAQ**: [copilot-setup-steps.yml](copilot-setup-steps.yml) - FAQ section
2. **Search Issues**: [GitHub Issues](https://github.com/7Spade/GigHub/issues)
3. **Ask Admin**: Contact repository administrator
4. **Create Issue**: If it's a new problem

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Main Instructions | 370 lines |
| Scoped Instructions | 4,674 lines |
| Total Guidance | 5,044+ lines |
| Instruction Files | 9 files |
| Custom Agents | 16+ agents |
| Chat Shortcuts | 6 shortcuts |
| MCP Servers | 6 servers |

## 🔐 Security

### Best Practices

1. **API Key Management**
   - Never hardcode keys in code
   - Use GitHub Secrets for storage
   - Rotate keys every 90 days
   - Use separate keys per environment

2. **Access Control**
   - Repository Secrets: Admin only
   - Personal API Keys: Individual use only
   - MCP Tokens: Never commit to repository
   - Follow principle of least privilege

3. **Monitoring**
   - Monitor unusual query patterns
   - Set up API usage alerts
   - Track RLS policy violations
   - Review access logs regularly

## 🤝 Contributing

### Updating Instructions

When making changes to instruction files:

1. Follow existing file structure
2. Include practical examples
3. Document version compatibility
4. Add JSDoc-style comments
5. Test with Copilot
6. Update this README if needed

### Adding New MCP Servers

1. Update [.github/copilot/mcp-servers.yml](copilot/mcp-servers.yml)
2. Add required secrets to GitHub
3. Document in [copilot-setup-steps.yml](copilot-setup-steps.yml)
4. Update this README
5. Notify team members

## 📝 License

Same as the main repository license.

---

**Maintained By**: GitHub Copilot & Repository Admins  
**Last Updated**: 2025-12-12  
**Version**: 1.0.0  

For issues or suggestions, please [create an issue](https://github.com/7Spade/GigHub/issues).
