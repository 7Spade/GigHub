# GigHub - Architecture Plan

## Executive Summary

This document provides a comprehensive architectural design for the GigHub platform, focusing on the authentication flow, database design, and Row Level Security (RLS) policies to prevent 42501 permission denied errors. The system uses a multi-layered authentication approach:

**Supabase Auth → Delon Auth → DA_SERVICE_TOKEN → Angular Application**

The core challenge addressed in this architecture is designing a robust RLS system that:
1. Avoids circular dependencies in policy checks
2. Properly handles the hierarchical structure: Users → Organizations → Teams → Blueprints
3. Uses SECURITY DEFINER helper functions to bypass RLS when needed
4. Maintains proper data isolation while allowing legitimate access

---

## System Context

### System Context Diagram

```mermaid
C4Context
    title GigHub System Context Diagram
    
    Person(user, "GigHub User", "End user of the platform")
    Person(admin, "Organization Admin", "Manages organizations and teams")
    Person(bot, "Bot Account", "Automated system account")
    
    System_Boundary(gighub, "GigHub Platform") {
        System(webapp, "Angular Web App", "Frontend application using Delon framework")
    }
    
    System_Ext(supabase_auth, "Supabase Auth", "Authentication service")
    System_Ext(supabase_db, "Supabase PostgreSQL", "Database with RLS")
    System_Ext(supabase_storage, "Supabase Storage", "File storage")
    System_Ext(supabase_realtime, "Supabase Realtime", "Real-time subscriptions")
    
    Rel(user, webapp, "Uses", "HTTPS")
    Rel(admin, webapp, "Manages", "HTTPS")
    Rel(bot, webapp, "Automates", "API")
    
    Rel(webapp, supabase_auth, "Authenticates via", "JWT")
    Rel(webapp, supabase_db, "Queries", "PostgREST")
    Rel(webapp, supabase_storage, "Uploads files", "S3 API")
    Rel(webapp, supabase_realtime, "Subscribes", "WebSocket")
```

### Explanation

**Overview**: The GigHub platform is a construction/project management system that allows users, organizations, and bots to manage blueprints (logical containers) containing tasks, diaries, and other modules.

**Key Components**:
- **Angular Web App**: Frontend using ng-alain/Delon framework with DA_SERVICE_TOKEN for auth state
- **Supabase Auth**: Handles user authentication, issues JWT tokens
- **Supabase PostgreSQL**: Database with Row Level Security policies
- **Supabase Storage**: File attachments for blueprints, tasks, diaries
- **Supabase Realtime**: Live updates for collaborative features

**Design Decisions**:
- Supabase chosen for its integrated auth + database + storage + realtime stack
- RLS used for row-level data isolation instead of application-level filtering
- SECURITY DEFINER functions prevent RLS circular dependency issues (42501 errors)

---

## Architecture Overview

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Angular as Angular App
    participant Delon as Delon Auth (DA_SERVICE_TOKEN)
    participant Supabase as Supabase Auth
    participant DB as PostgreSQL + RLS
    
    User->>Angular: Access Application
    Angular->>Supabase: supabase.auth.signIn()
    Supabase-->>Angular: JWT Token + User Session
    Angular->>Delon: Store token in DA_SERVICE_TOKEN
    Delon->>Angular: Auth state available
    
    User->>Angular: Request data (e.g., blueprints)
    Angular->>DB: Query with JWT in Authorization header
    DB->>DB: auth.uid() extracts user from JWT
    DB->>DB: RLS policies evaluate using auth.uid()
    DB->>DB: Helper functions (SECURITY DEFINER) check permissions
    DB-->>Angular: Filtered data based on RLS
    Angular-->>User: Display data
```

### High-Level Architecture Patterns

1. **Account Type Pattern**: Single `accounts` table with `type` column (User/Organization/Bot)
2. **Membership Pattern**: Separate tables for organization members, team members, blueprint members
3. **Helper Function Pattern**: SECURITY DEFINER functions bypass RLS for permission checks
4. **Direct Auth Check Pattern**: Store `auth_user_id` in membership tables for direct checks

---

## Component Architecture

### Component Diagram

```mermaid
flowchart TB
    subgraph "Authentication Layer"
        SA[Supabase Auth]
        DA[Delon Auth\nDA_SERVICE_TOKEN]
    end
    
    subgraph "Foundation Layer"
        ACC[Accounts\nUser/Org/Bot]
        OM[Organization\nMembers]
        TM[Team Members]
        TB[Team Bots]
    end
    
    subgraph "Container Layer"
        BP[Blueprints]
        BM[Blueprint\nMembers]
    end
    
    subgraph "Business Layer"
        TK[Tasks]
        DY[Diaries]
        CK[Checklists]
        AT[Attachments]
    end
    
    subgraph "Helper Functions\n(SECURITY DEFINER)"
        F1[get_user_account_id]
        F2[is_org_member]
        F3[is_org_admin]
        F4[is_org_owner]
        F5[is_team_leader]
        F6[is_team_member]
        F7[is_blueprint_member]
        F8[is_blueprint_admin]
        F9[is_blueprint_owner]
    end
    
    SA --> DA
    DA --> ACC
    
    ACC --> OM
    ACC --> TM
    ACC --> TB
    ACC --> BP
    
    OM --> F2
    OM --> F3
    OM --> F4
    TM --> F5
    TM --> F6
    
    BP --> BM
    BM --> F7
    BM --> F8
    BM --> F9
    
    BP --> TK
    BP --> DY
    BP --> CK
    TK --> AT
    DY --> AT
```

### Component Responsibilities

| Component | Responsibility | Key Fields |
|-----------|---------------|------------|
| **accounts** | Store all account types | id, auth_user_id, type, status |
| **organization_members** | Org → User membership | org_id, account_id, auth_user_id, role |
| **teams** | Sub-units of organizations | id, organization_id, name |
| **team_members** | Team → User membership | team_id, account_id, auth_user_id, role |
| **blueprints** | Logical containers | id, owner_id, status, visibility |
| **blueprint_members** | Blueprint → User membership | blueprint_id, account_id, auth_user_id, role |
| **Helper Functions** | Permission checks with RLS bypass | Uses SECURITY DEFINER |

### Design Decisions

**Why store `auth_user_id` in membership tables?**
- Enables direct RLS checks without joining through accounts table
- Avoids the circular dependency: `SELECT policy → helper function → SELECT accounts → RLS check → helper function...`
- Critical for preventing 42501 errors

**Why use SECURITY DEFINER?**
- Functions run with the privileges of the function owner (postgres)
- Combined with `SET row_security = off`, allows bypassing RLS within the function
- Essential for permission check functions that need to query protected tables

---

## Data Flow

### Data Flow Diagram

```mermaid
flowchart LR
    subgraph "Client"
        APP[Angular App]
    end
    
    subgraph "Auth"
        JWT[JWT Token\nauth.uid]
    end
    
    subgraph "Database Layer"
        subgraph "RLS Evaluation"
            POL[RLS Policies]
            HF[Helper Functions\nSECURITY DEFINER]
        end
        
        subgraph "Tables"
            ACC[(accounts)]
            OM[(org_members)]
            TM[(team_members)]
            BP[(blueprints)]
            BM[(bp_members)]
            BIZ[(business data)]
        end
    end
    
    APP -->|"Query with JWT"| POL
    JWT -->|"auth.uid()"| POL
    
    POL -->|"Check: auth_user_id = auth.uid()"| ACC
    POL -->|"Check: is_org_member()"| HF
    POL -->|"Check: is_blueprint_member()"| HF
    
    HF -->|"SECURITY DEFINER\nbypass RLS"| OM
    HF -->|"bypass RLS"| TM
    HF -->|"bypass RLS"| BM
    
    POL -->|"Allow/Deny"| BP
    POL -->|"Allow/Deny"| BIZ
```

### Data Flow Explanation

**Query Flow (avoiding 42501)**:

1. **Client sends query** with JWT token containing `auth.uid()`
2. **RLS policy evaluates** using one of two patterns:
   - **Direct check**: `auth_user_id = auth.uid()` (no function call, no recursion)
   - **Function check**: `is_blueprint_member(id)` (uses SECURITY DEFINER)
3. **Helper function executes** with RLS disabled (SECURITY DEFINER + `SET row_security = off`)
4. **Function returns boolean** without triggering additional RLS checks
5. **Policy allows/denies** based on result

**Critical Pattern for Self-Discovery**:
```sql
-- CORRECT: Allow users to discover their own memberships
USING (
  auth_user_id = auth.uid()  -- Direct check, no recursion
  OR
  is_org_member(organization_id)  -- Function for checking others
)
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    ACCOUNTS {
        uuid id PK
        uuid auth_user_id UK
        text type "User|Organization|Bot"
        text status "active|inactive|deleted"
        text name
        text email UK
        timestamp created_at
    }
    
    ORGANIZATIONS {
        uuid id PK
        uuid account_id FK "→ accounts (type=Organization)"
        text slug UK
        text display_name
    }
    
    ORGANIZATION_MEMBERS {
        uuid id PK
        uuid organization_id FK
        uuid account_id FK
        uuid auth_user_id "Denormalized for RLS"
        text role "owner|admin|member"
    }
    
    TEAMS {
        uuid id PK
        uuid organization_id FK
        text name
    }
    
    TEAM_MEMBERS {
        uuid id PK
        uuid team_id FK
        uuid account_id FK
        uuid auth_user_id "Denormalized for RLS"
        text role "leader|member"
    }
    
    BLUEPRINTS {
        uuid id PK
        uuid owner_id FK "→ accounts"
        uuid created_by FK
        text name
        text status "draft|active|archived|deleted"
        text visibility "private|internal|public"
    }
    
    BLUEPRINT_MEMBERS {
        uuid id PK
        uuid blueprint_id FK
        uuid account_id FK
        uuid auth_user_id "Denormalized for RLS"
        text role "owner|admin|member|viewer"
    }
    
    TASKS {
        uuid id PK
        uuid blueprint_id FK
        text title
        text status
    }
    
    DIARIES {
        uuid id PK
        uuid blueprint_id FK
        date work_date
        text content
    }
    
    ACCOUNTS ||--o{ ORGANIZATION_MEMBERS : "belongs to"
    ACCOUNTS ||--o{ TEAM_MEMBERS : "belongs to"
    ACCOUNTS ||--o{ BLUEPRINT_MEMBERS : "participates in"
    ACCOUNTS ||--o{ BLUEPRINTS : "owns"
    
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : "has"
    ORGANIZATIONS ||--o{ TEAMS : "contains"
    
    TEAMS ||--o{ TEAM_MEMBERS : "has"
    
    BLUEPRINTS ||--o{ BLUEPRINT_MEMBERS : "has"
    BLUEPRINTS ||--o{ TASKS : "contains"
    BLUEPRINTS ||--o{ DIARIES : "contains"
```

### ERD Explanation

**Key Design Points**:

1. **Denormalized `auth_user_id`**: Stored in membership tables to enable direct RLS checks
2. **Account Type Discrimination**: Single accounts table with type column
3. **Blueprint as Container**: All business data references blueprint_id
4. **Soft Delete Pattern**: status/deleted_at instead of hard delete

---

## Deployment Architecture

### Deployment Diagram

```mermaid
flowchart TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOB[Mobile App]
    end
    
    subgraph "CDN/Edge"
        CDN[CDN\nStatic Assets]
    end
    
    subgraph "Supabase Platform"
        subgraph "API Gateway"
            KONG[Kong Gateway]
        end
        
        subgraph "Auth Service"
            GOTRUE[GoTrue\nSupabase Auth]
        end
        
        subgraph "API Service"
            POSTGREST[PostgREST\nAuto-generated API]
        end
        
        subgraph "Realtime Service"
            RT[Realtime Server\nWebSocket]
        end
        
        subgraph "Storage Service"
            STORAGE[Storage API\nS3 Compatible]
        end
        
        subgraph "Database"
            PG[(PostgreSQL 15)]
            RLS[RLS Policies]
            FUNC[Helper Functions]
        end
    end
    
    WEB --> CDN
    MOB --> CDN
    CDN --> KONG
    
    KONG --> GOTRUE
    KONG --> POSTGREST
    KONG --> RT
    KONG --> STORAGE
    
    GOTRUE --> PG
    POSTGREST --> PG
    RT --> PG
    STORAGE --> PG
    
    PG --> RLS
    RLS --> FUNC
```

### Deployment Explanation

**Infrastructure Components**:
- **Supabase Platform**: Managed PostgreSQL with integrated services
- **Kong Gateway**: API routing, rate limiting, auth header injection
- **PostgREST**: Auto-generates REST API from PostgreSQL schema
- **GoTrue**: JWT-based authentication service

**NFR Considerations**:
- **Scalability**: Supabase handles horizontal scaling
- **Security**: RLS at database level, JWT authentication
- **Reliability**: Managed service with built-in HA
- **Performance**: Connection pooling via Supavisor

---

## Key Workflows

### Blueprint Creation Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant A as Angular App
    participant S as Supabase PostgREST
    participant R as RLS Policy
    participant T as Trigger
    participant F as Helper Function
    participant D as Database
    
    U->>A: Create Blueprint
    A->>S: INSERT INTO blueprints (name, owner_id)
    S->>R: Check INSERT policy
    R->>F: get_user_account_id()
    F->>D: SELECT from accounts (RLS off)
    D-->>F: account_id
    F-->>R: Return account_id
    R-->>S: Policy passed
    S->>D: Insert blueprint
    D->>T: AFTER INSERT trigger
    T->>D: Insert blueprint_member (owner)
    D-->>S: Return new blueprint
    S-->>A: Blueprint created
    A-->>U: Success
```

### Permission Check Sequence (Avoiding 42501)

```mermaid
sequenceDiagram
    participant A as Angular App
    participant S as PostgREST
    participant R as RLS Policy
    participant F as is_blueprint_member()
    participant D as blueprint_members table
    
    A->>S: SELECT * FROM tasks WHERE blueprint_id = X
    S->>R: Evaluate RLS policy
    
    Note over R: Policy: is_blueprint_member(blueprint_id)
    
    R->>F: Call helper function
    
    Note over F: SECURITY DEFINER<br/>SET row_security = off
    
    F->>D: SELECT EXISTS (... WHERE auth_user_id = auth.uid())
    
    Note over D: RLS bypassed due to<br/>SECURITY DEFINER
    
    D-->>F: true/false
    F-->>R: Return result
    R-->>S: Allow/Deny query
    S-->>A: Filtered results
```

### Self-Discovery Pattern (Critical for 42501 Fix)

```mermaid
sequenceDiagram
    participant A as Angular App
    participant S as PostgREST
    participant R as RLS Policy
    participant D as organization_members
    
    A->>S: SELECT * FROM organization_members
    S->>R: Evaluate SELECT policy
    
    Note over R: Policy Check Order:<br/>1. auth_user_id = auth.uid()<br/>2. OR is_org_member(org_id)
    
    R->>D: Check: auth_user_id = auth.uid()
    
    Note over D: Direct column check<br/>No function call<br/>No RLS recursion!
    
    D-->>R: Match found (user's own record)
    R-->>S: Allow access
    S-->>A: User's membership records
    
    Note over A: User can now discover<br/>which orgs they belong to
```

---

## RLS Design Patterns

### Pattern 1: Direct Auth Check (No Recursion)

```sql
-- For membership tables: allow self-discovery
CREATE POLICY "self_discovery" ON organization_members
FOR SELECT TO authenticated
USING (
  auth_user_id = auth.uid()  -- Direct check, no recursion
);
```

**When to use**: Membership tables where users need to discover their own memberships.

### Pattern 2: SECURITY DEFINER Helper Function

```sql
CREATE FUNCTION is_org_member(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off  -- Critical!
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = target_org_id
      AND auth_user_id = auth.uid()
  );
END;
$$;
```

**When to use**: Permission checks that need to query protected tables.

### Pattern 3: Combined Policy (Self + Others)

```sql
CREATE POLICY "view_members" ON organization_members
FOR SELECT TO authenticated
USING (
  -- Self-discovery (no function call)
  auth_user_id = auth.uid()
  OR
  -- View other members (uses helper)
  is_org_member(organization_id)
);
```

**When to use**: Tables where users need both self-discovery and access to related records.

### Pattern 4: Cascading Permission Check

```sql
-- For business data tables
CREATE POLICY "blueprint_tasks_access" ON tasks
FOR SELECT TO authenticated
USING (
  is_blueprint_member(blueprint_id)  -- Single function call
);
```

**When to use**: Business data tables that inherit permissions from parent containers.

---

## Phased Development

### Phase 1: Foundation Layer (Initial Implementation)

```mermaid
erDiagram
    ACCOUNTS {
        uuid id PK
        uuid auth_user_id
        text type
    }
    
    ORGANIZATION_MEMBERS {
        uuid organization_id
        uuid account_id
        uuid auth_user_id
        text role
    }
    
    TEAM_MEMBERS {
        uuid team_id
        uuid account_id
        uuid auth_user_id
        text role
    }
```

**Focus**:
- accounts table with proper RLS
- organization_members with self-discovery pattern
- team_members with self-discovery pattern
- Helper functions: get_user_account_id, is_org_member, is_team_member

### Phase 2: Container Layer

```mermaid
erDiagram
    BLUEPRINTS {
        uuid id
        uuid owner_id
        text visibility
    }
    
    BLUEPRINT_MEMBERS {
        uuid blueprint_id
        uuid account_id
        uuid auth_user_id
        text role
    }
```

**Focus**:
- blueprints table with visibility-based access
- blueprint_members with self-discovery pattern
- Helper functions: is_blueprint_member, is_blueprint_admin
- Auto-add creator as owner trigger

### Phase 3: Business Layer

```mermaid
erDiagram
    TASKS {
        uuid blueprint_id
        text status
    }
    
    DIARIES {
        uuid blueprint_id
        date work_date
    }
    
    CHECKLISTS {
        uuid blueprint_id
    }
```

**Focus**:
- All business tables reference blueprint_id
- Simple RLS: `is_blueprint_member(blueprint_id)`
- No additional helper functions needed

### Migration Path

1. **Deploy foundation layer** with proper RLS patterns
2. **Test self-discovery** for all membership tables
3. **Deploy container layer** (blueprints)
4. **Test blueprint creation flow** including auto-owner trigger
5. **Deploy business layer** incrementally
6. **Monitor for 42501 errors** and adjust policies

---

## Non-Functional Requirements Analysis

### Scalability

| Aspect | Approach |
|--------|----------|
| **Database** | PostgreSQL with connection pooling (Supavisor) |
| **Queries** | Indexed columns for RLS checks (auth_user_id, blueprint_id) |
| **Functions** | STABLE marking for query optimizer caching |
| **Data Growth** | Soft delete + archiving strategy |

### Performance

| Aspect | Approach |
|--------|----------|
| **RLS Overhead** | SECURITY DEFINER reduces query nesting |
| **Index Strategy** | Composite indexes on membership tables |
| **Function Cost** | Minimal - single EXISTS check |
| **Query Planning** | STABLE functions allow optimizer to cache results |

**Recommended Indexes**:
```sql
CREATE INDEX idx_org_members_auth_user ON organization_members(auth_user_id);
CREATE INDEX idx_bp_members_auth_user ON blueprint_members(auth_user_id);
CREATE INDEX idx_bp_members_blueprint ON blueprint_members(blueprint_id);
CREATE INDEX idx_tasks_blueprint ON tasks(blueprint_id);
```

### Security

| Aspect | Approach |
|--------|----------|
| **Authentication** | Supabase Auth with JWT |
| **Authorization** | RLS policies + helper functions |
| **Data Isolation** | Blueprint-level isolation |
| **Audit Trail** | created_at, updated_at, created_by columns |

**Security Considerations**:
- SECURITY DEFINER functions have elevated privileges - minimize attack surface
- Revoke EXECUTE from anon and public roles
- Use SET search_path to prevent search path attacks

### Reliability

| Aspect | Approach |
|--------|----------|
| **Data Integrity** | Foreign key constraints with ON DELETE CASCADE |
| **Consistency** | ACID transactions for membership changes |
| **Recovery** | Soft delete pattern for accidental deletions |
| **Failover** | Supabase managed HA |

### Maintainability

| Aspect | Approach |
|--------|----------|
| **Code Organization** | Separate migrations per feature |
| **Documentation** | Comments on policies and functions |
| **Testing** | Migration scripts with ROLLBACK capability |
| **Debugging** | Policy names explain their purpose |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Circular RLS dependency** | 42501 errors | Use SECURITY DEFINER + direct auth checks |
| **Performance degradation** | Slow queries | Index auth_user_id columns, use STABLE functions |
| **Security bypass** | Data leak | Revoke function access from anon, test RLS thoroughly |
| **Migration failures** | System downtime | Use transactions, test in staging |
| **Complex policy debugging** | Development slowdown | Document policies, use meaningful names |

---

## Technology Stack Recommendations

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Database** | PostgreSQL 15+ | Row Level Security, JSONB, extensive indexing |
| **Backend** | Supabase | Integrated auth, realtime, storage |
| **Frontend** | Angular + ng-alain | Enterprise framework with Delon auth |
| **Auth** | Supabase Auth + JWT | Seamless integration, DA_SERVICE_TOKEN |
| **API** | PostgREST (auto-generated) | Zero backend code, RLS-enforced |

---

## 42501 Error Prevention Checklist

Before deploying any RLS policy, verify:

- [ ] **Membership tables have self-discovery pattern**: `auth_user_id = auth.uid()` first
- [ ] **Helper functions use SECURITY DEFINER**: With `SET row_security = off`
- [ ] **auth_user_id is indexed**: For fast direct lookups
- [ ] **Functions are STABLE**: For query optimizer benefits
- [ ] **EXECUTE is revoked from anon/public**: Security hardening
- [ ] **Policy comments explain purpose**: For maintainability
- [ ] **Circular dependencies tested**: Query each table as different users

---

## Next Steps

1. **Review existing migrations** for compliance with patterns
2. **Add missing indexes** on auth_user_id columns
3. **Test self-discovery queries** for all membership tables
4. **Deploy blueprint layer** following Phase 2 guidelines
5. **Implement monitoring** for 42501 errors in production
6. **Create integration tests** for RLS policies

---

## Appendix: Helper Function Reference

### get_user_account_id()
Returns the account_id for the current authenticated user.

### is_org_member(org_id)
Returns true if current user is a member of the organization.

### is_org_admin(org_id)
Returns true if current user is an admin or owner of the organization.

### is_org_owner(org_id)
Returns true if current user is the owner of the organization.

### is_team_member(team_id)
Returns true if current user is a member of the team.

### is_team_leader(team_id)
Returns true if current user is a leader of the team.

### is_blueprint_member(blueprint_id)
Returns true if current user is a member of the blueprint.

### is_blueprint_admin(blueprint_id)
Returns true if current user is an admin or owner of the blueprint.

### is_blueprint_owner(blueprint_id)
Returns true if current user is the owner of the blueprint.

All functions follow the pattern:
```sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
```
