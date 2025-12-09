# Team Module Agent Guide

The Team module manages team collaboration within organizations in GigHub (Foundation Layer).

## Module Purpose

The Team module provides:
- **Team Management** - Create, edit, delete teams
- **Member Assignment** - Add/remove team members
- **Team Permissions** - Role-based access within teams
- **Team Dashboard** - Team activity and metrics
- **Blueprint Access** - Team-level blueprint sharing

## Module Structure

```
src/app/routes/team/
├── AGENTS.md              # This file
├── routes.ts              # Module routing
└── members/               # Team member management
    ├── member-list.component.ts
    └── member-modal.component.ts
```

## Data Models

### Team

```typescript
interface Team {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  
  // Leadership
  leader_id: string;          // Team leader user ID
  
  // Status
  status: 'active' | 'archived';
  
  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
```

### TeamMember

```typescript
interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  
  role: 'leader' | 'member';
  
  joined_at: string;
  added_by: string;
}
```

## Key Features

### Team List

- Display all teams in organization
- Filter by status or leader
- Create new team
- Team member count

### Team Detail

- Team information and description
- Member list with roles
- Team activity timeline
- Assigned blueprints

### Member Management

- Add organization members to team
- Assign team roles (leader/member)
- Remove team members
- Transfer leadership

### Team Permissions

Teams can be granted permissions on blueprints:

```typescript
interface BlueprintTeamPermission {
  blueprint_id: string;
  team_id: string;
  role: 'viewer' | 'contributor' | 'maintainer';
}
```

## Routing

```typescript
export const routes: Routes = [
  {
    path: '',
    component: TeamListComponent,
    data: { title: 'Teams' }
  },
  {
    path: ':id',
    component: TeamDetailComponent,
    children: [
      { path: 'members', component: TeamMemberListComponent },
      { path: 'blueprints', component: TeamBlueprintsComponent }
    ]
  }
];
```

## Firebase/Firestore Collections

### Collections

- **teams** - Team documents
- **team_members** - Team membership
- **blueprint_team_permissions** - Team access to blueprints

### Security Rules

```javascript
match /teams/{teamId} {
  allow read: if isMemberOfTeam(teamId) || isMemberOfOrg(getTeamOrgId(teamId));
  allow write: if isTeamLeader(teamId) || isOrgAdmin(getTeamOrgId(teamId));
}

match /team_members/{memberId} {
  allow read: if isMemberOfTeam(getTeamId(memberId));
  allow create: if isTeamLeader(getTeamId(memberId));
  allow delete: if isTeamLeader(getTeamId(memberId)) || isSelf(resource.data.user_id);
}
```

## Integration Points

### With Organization

- Teams belong to organizations
- Only organization members can join teams
- Organization admins can manage all teams

### With Blueprint

- Teams can be granted blueprint access
- Team members inherit team permissions
- Simplifies permission management

### Use Cases

1. **Project Teams** - Assign teams to specific blueprints
2. **Department Teams** - Engineering, QA, Management teams
3. **External Teams** - Contractor or client teams

## Best Practices

1. **Team Size** - Keep teams manageable (5-15 members)
2. **Clear Roles** - Define team leader and responsibilities
3. **Permission Inheritance** - Use team permissions for efficiency
4. **Activity Tracking** - Log team actions for accountability
5. **Communication** - Integrate with notification system

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application structure
- **[Organization Module](../organization/AGENTS.md)** - Parent organization
- **[Blueprint Module](../blueprint/AGENTS.md)** - Blueprint permissions
- **[Core Services](../../core/AGENTS.md)** - Permission service

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development
