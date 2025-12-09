# User Module Agent Guide

The User module manages individual user profiles and settings in GigHub (Foundation Layer).

## Module Purpose

The User module provides:
- **User Profile** - Display and edit user information
- **Account Settings** - Preferences and configuration
- **Avatar Management** - Profile picture upload
- **Notification Preferences** - Email and in-app notifications
- **Privacy Settings** - Data sharing and visibility

## Module Structure

```
src/app/routes/user/
├── AGENTS.md              # This file
├── routes.ts              # Module routing
└── settings/              # User settings
    ├── profile.component.ts
    ├── security.component.ts
    ├── notifications.component.ts
    └── preferences.component.ts
```

## Data Models

### User (Firebase Auth User)

Firebase Authentication provides core user identity:

```typescript
interface FirebaseUser {
  uid: string;                // Unique user ID
  email: string;              // Email address
  emailVerified: boolean;     // Email verification status
  displayName: string | null; // Display name
  photoURL: string | null;    // Avatar URL
  phoneNumber: string | null; // Phone number
  disabled: boolean;          // Account disabled flag
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}
```

### UserProfile (Extended Profile in Firestore)

```typescript
interface UserProfile {
  user_id: string;            // Firebase Auth UID
  
  // Basic Info
  display_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  
  // Professional
  job_title?: string;
  company?: string;
  department?: string;
  
  // Preferences
  language: 'zh-TW' | 'en-US';
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  
  // Notifications
  email_notifications: boolean;
  push_notifications: boolean;
  
  // Privacy
  profile_visibility: 'public' | 'organization' | 'private';
  
  // Metadata
  created_at: string;
  updated_at: string;
}
```

## Key Features

### User Profile Page

- Display user information
- Edit profile fields
- Upload/change avatar
- View activity history

### Account Settings

#### Profile Settings
- Basic information (name, email, phone)
- Professional details (job title, company)
- Bio and description
- Avatar upload (Firebase Storage)

#### Security Settings
- Change password
- Two-factor authentication (2FA)
- Active sessions
- Login history

#### Notification Preferences
- Email notifications toggle
- Push notifications toggle
- Notification categories (tasks, mentions, updates)
- Frequency settings (real-time, daily digest, weekly)

#### Preferences
- Language selection
- Timezone configuration
- Theme (light/dark/auto)
- Date/time format

## Routing

```typescript
export const routes: Routes = [
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [authGuard],
    data: { title: 'My Profile' }
  },
  {
    path: 'settings',
    component: UserSettingsComponent,
    canActivate: [authGuard],
    children: [
      { path: 'profile', component: ProfileSettingsComponent },
      { path: 'security', component: SecuritySettingsComponent },
      { path: 'notifications', component: NotificationSettingsComponent },
      { path: 'preferences', component: PreferencesComponent }
    ]
  }
];
```

## Implementation Examples

### Profile Component

```typescript
import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { FirebaseAuthService } from '@core/services/firebase-auth.service';
import { UserProfileService } from '@shared/services/user/user-profile.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="Profile Settings">
      <form nz-form [formGroup]="form" (ngSubmit)="save()">
        <!-- Avatar Upload -->
        <nz-form-item>
          <nz-form-control>
            <nz-upload
              nzAction="/api/upload/avatar"
              nzListType="picture-card"
              [nzShowUploadList]="false"
              (nzChange)="handleAvatarChange($event)">
              <nz-avatar
                [nzSize]="128"
                [nzSrc]="avatarUrl()"
                [nzText]="userInitial()" />
            </nz-upload>
          </nz-form-control>
        </nz-form-item>
        
        <!-- Display Name -->
        <nz-form-item>
          <nz-form-label nzRequired>Display Name</nz-form-label>
          <nz-form-control nzErrorTip="Please enter your name">
            <input nz-input formControlName="displayName" />
          </nz-form-control>
        </nz-form-item>
        
        <!-- Email (read-only) -->
        <nz-form-item>
          <nz-form-label>Email</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="email" [disabled]="true" />
          </nz-form-control>
        </nz-form-item>
        
        <!-- Phone -->
        <nz-form-item>
          <nz-form-label>Phone</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="phone" />
          </nz-form-control>
        </nz-form-item>
        
        <!-- Bio -->
        <nz-form-item>
          <nz-form-label>Bio</nz-form-label>
          <nz-form-control>
            <textarea nz-input formControlName="bio" [nzAutosize]="{ minRows: 3, maxRows: 6 }"></textarea>
          </nz-form-control>
        </nz-form-item>
        
        <!-- Save Button -->
        <button nz-button nzType="primary" [nzLoading]="loading()">
          Save Changes
        </button>
      </form>
    </nz-card>
  `
})
export class ProfileSettingsComponent {
  private fb = inject(FormBuilder);
  private authService = inject(FirebaseAuthService);
  private profileService = inject(UserProfileService);
  
  loading = signal(false);
  avatarUrl = signal('');
  
  form: FormGroup = this.fb.group({
    displayName: ['', Validators.required],
    email: [''],
    phone: [''],
    bio: ['']
  });
  
  userInitial = computed(() => {
    return this.form.get('displayName')?.value?.charAt(0).toUpperCase() || 'U';
  });
  
  ngOnInit(): void {
    this.loadProfile();
  }
  
  async loadProfile(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    
    const profile = await this.profileService.getProfile(user.uid);
    
    this.form.patchValue({
      displayName: profile.display_name,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio
    });
    
    this.avatarUrl.set(profile.avatar_url || '');
  }
  
  async save(): Promise<void> {
    if (this.form.invalid) return;
    
    this.loading.set(true);
    
    try {
      const user = this.authService.currentUser!;
      await this.profileService.updateProfile(user.uid, {
        display_name: this.form.value.displayName,
        phone: this.form.value.phone,
        bio: this.form.value.bio
      });
      
      // Also update Firebase Auth display name
      await this.authService.updateProfile({
        displayName: this.form.value.displayName
      });
      
      this.message.success('Profile updated successfully');
    } catch (error) {
      this.message.error('Failed to update profile');
    } finally {
      this.loading.set(false);
    }
  }
  
  handleAvatarChange(info: any): void {
    if (info.file.status === 'done') {
      this.avatarUrl.set(info.file.response.url);
    }
  }
}
```

### Notification Preferences

```typescript
@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="Notification Preferences">
      <form nz-form [formGroup]="form" (ngSubmit)="save()">
        <!-- Email Notifications -->
        <nz-form-item>
          <nz-form-control>
            <label nz-checkbox formControlName="emailNotifications">
              Email Notifications
            </label>
          </nz-form-control>
        </nz-form-item>
        
        <!-- Push Notifications -->
        <nz-form-item>
          <nz-form-control>
            <label nz-checkbox formControlName="pushNotifications">
              Push Notifications
            </label>
          </nz-form-control>
        </nz-form-item>
        
        <!-- Notification Categories -->
        <nz-divider nzText="Categories"></nz-divider>
        
        @for (category of notificationCategories; track category.key) {
          <nz-form-item>
            <nz-form-control>
              <label nz-checkbox [formControlName]="category.key">
                {{ category.label }}
              </label>
              <div class="help-text">{{ category.description }}</div>
            </nz-form-control>
          </nz-form-item>
        }
        
        <button nz-button nzType="primary" [nzLoading]="loading()">
          Save Preferences
        </button>
      </form>
    </nz-card>
  `
})
export class NotificationSettingsComponent {
  notificationCategories = [
    {
      key: 'taskAssigned',
      label: 'Task Assigned',
      description: 'Notify when a task is assigned to you'
    },
    {
      key: 'taskCompleted',
      label: 'Task Completed',
      description: 'Notify when a task you created is completed'
    },
    {
      key: 'mentioned',
      label: 'Mentions',
      description: 'Notify when someone mentions you'
    },
    {
      key: 'blueprintUpdated',
      label: 'Blueprint Updates',
      description: 'Notify about changes to your blueprints'
    }
  ];
  
  // Implementation similar to ProfileSettingsComponent
}
```

## Firebase/Firestore Collections

### Collections

- **user_profiles** - Extended user profile data
- **user_preferences** - User settings and preferences
- **user_sessions** - Active sessions (optional)

### Security Rules

```javascript
match /user_profiles/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId;
}

match /user_preferences/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

## Best Practices

1. **Privacy** - Respect user data privacy
2. **Validation** - Validate all input fields
3. **Real-time Sync** - Use Firebase Auth state listener
4. **Avatar Storage** - Use Firebase Storage for images
5. **Preferences** - Cache locally for performance

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application structure
- **[Core Services](../../core/AGENTS.md)** - Auth service
- **[Passport Module](../passport/AGENTS.md)** - Authentication

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development
