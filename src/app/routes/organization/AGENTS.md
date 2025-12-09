# Organization Module Agent Guide

The Organization module manages multi-tenant organization features in GigHub (Foundation Layer).

## Module Purpose

The Organization module provides:
- **Organization Management** - Create, view, edit organizations
- **Member Management** - Add/remove organization members
- **Team Management** - Create and manage teams within organizations
- **Settings** - Organization-level configuration
- **Multi-tenancy** - Support for multiple organizations per user

## Module Structure

```
src/app/routes/organization/
├── AGENTS.md              # This file
├── routes.ts              # Module routing
├── members/               # Member management
│   ├── member-list.component.ts
│   └── member-modal.component.ts
├── teams/                 # Team management
│   ├── team-list.component.ts
│   └── team-modal.component.ts
└── settings/              # Organization settings
    ├── general.component.ts
    ├── billing.component.ts
    └── integrations.component.ts
```

## Data Models

### Organization

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  
  // Ownership
  owner_id: string;           // User who created the org
  
  // Status
  status: 'active' | 'suspended' | 'archived';
  subscription_tier: 'free' | 'pro' | 'enterprise';
  
  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
```

### OrganizationMember

```typescript
interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  
  role: 'owner' | 'admin' | 'member';
  
  joined_at: string;
  invited_by: string;
}
```

## Key Features

### Organization List

- Display all organizations user belongs to
- Filter by role or status
- Quick actions (view, edit, leave)
- Create new organization button

### Member Management

- List all organization members
- Invite new members via email
- Change member roles
- Remove members
- Permission-based UI

### Team Management

- Create teams within organization
- Assign members to teams
- Team-level permissions
- Team dashboards

### Organization Settings

- **General** - Name, logo, description
- **Billing** - Subscription, payment methods
- **Integrations** - Third-party services
- **Security** - 2FA, SSO configuration

## Routing

```typescript
export const routes: Routes = [
  {
    path: '',
    component: OrganizationListComponent,
    data: { title: 'Organizations' }
  },
  {
    path: ':id',
    component: OrganizationDetailComponent,
    children: [
      { path: 'members', component: MemberListComponent },
      { path: 'teams', component: TeamListComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  }
];
```

## Firebase/Firestore Collections

### Collections

- **organizations** - Main organization documents
- **organization_members** - Member associations
- **organization_teams** - Teams within organizations
- **organization_invitations** - Pending invites

### Security Rules

```javascript
match /organizations/{orgId} {
  allow read: if isMember(orgId);
  allow write: if isAdmin(orgId);
}

match /organization_members/{memberId} {
  allow read: if isMember(resource.data.organization_id);
  allow create: if isAdmin(getOrgId(memberId));
  allow update, delete: if isOwner(getOrgId(memberId));
}
```

## Integration with Blueprint

Organizations can own blueprints:

```typescript
interface Blueprint {
  owner_type: 'user' | 'organization';
  owner_id: string;  // Organization ID if owner_type is 'organization'
}
```

**Benefits**:
- Shared access to blueprints
- Team-based collaboration
- Centralized billing
- Organization-level permissions

## Best Practices

1. **Multi-tenancy** - Isolate data by organization_id
2. **Permissions** - Enforce role-based access control
3. **Invitations** - Email verification for new members
4. **Billing** - Track subscription status
5. **Soft Delete** - Maintain data integrity

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application structure
- **[Core Services](../../core/AGENTS.md)** - Shared services
- **[Team Module](../team/AGENTS.md)** - Team management
- **[Blueprint Module](../blueprint/AGENTS.md)** - Blueprint ownership

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development
