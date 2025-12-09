```instructions
---
description: 'AngularFire integration patterns for Firebase services in Angular applications'
applyTo: '**/*.ts'
---

# AngularFire Integration Guidelines

Instructions for integrating Firebase services using AngularFire in Angular 20 applications.

## Overview

AngularFire is the official Angular library for Firebase, providing:
- Reactive bindings for Firebase services
- Angular dependency injection integration
- TypeScript support with strong typing
- Optimized for Angular's change detection
- Works seamlessly with Angular Signals

## Installation & Setup

```bash
# Install AngularFire
yarn add @angular/fire firebase

# Install types
yarn add -D @types/firebase
```

## Configuration

### Environment Configuration

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID'
  }
};
```

### App Configuration

```typescript
// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { environment } from '@env/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideFunctions(() => getFunctions())
  ]
};
```

## Authentication (AngularFire Auth)

### Auth Service

```typescript
import { inject, Injectable, signal } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  
  // Current user as signal
  currentUser = signal<User | null>(null);
  
  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
    });
  }
  
  // Email/Password login
  login(email: string, password: string): Observable<void> {
    return from(
      signInWithEmailAndPassword(this.auth, email, password)
        .then(() => {
          this.router.navigate(['/dashboard']);
        })
    );
  }
  
  // Register new user
  register(email: string, password: string): Observable<void> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
        .then(() => {
          this.router.navigate(['/dashboard']);
        })
    );
  }
  
  // Google Sign-In
  signInWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
    return from(
      signInWithPopup(this.auth, provider)
        .then(() => {
          this.router.navigate(['/dashboard']);
        })
    );
  }
  
  // Sign out
  logout(): Observable<void> {
    return from(
      signOut(this.auth).then(() => {
        this.router.navigate(['/login']);
      })
    );
  }
  
  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}
```

### Auth Guard

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { FirebaseAuthService } from '@core/services/firebase-auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(FirebaseAuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

### Login Component

```typescript
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseAuthService } from '@core/services/firebase-auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="login-container">
      <nz-card nzTitle="Login">
        <form nz-form [formGroup]="form" (ngSubmit)="login()">
          <nz-form-item>
            <nz-form-control nzErrorTip="Please input email!">
              <input nz-input formControlName="email" placeholder="Email" />
            </nz-form-control>
          </nz-form-item>
          
          <nz-form-item>
            <nz-form-control nzErrorTip="Please input password!">
              <input 
                nz-input 
                type="password" 
                formControlName="password" 
                placeholder="Password" 
              />
            </nz-form-control>
          </nz-form-item>
          
          <button 
            nz-button 
            nzType="primary" 
            nzBlock
            [nzLoading]="loading()"
            [disabled]="!form.valid"
          >
            Login
          </button>
          
          <button 
            nz-button 
            nzBlock
            type="button"
            (click)="loginWithGoogle()"
          >
            <span nz-icon nzType="google"></span>
            Sign in with Google
          </button>
        </form>
      </nz-card>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(FirebaseAuthService);
  private message = inject(NzMessageService);
  
  loading = signal(false);
  
  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  
  login(): void {
    if (this.form.valid) {
      this.loading.set(true);
      const { email, password } = this.form.value;
      
      this.authService.login(email, password).subscribe({
        next: () => {
          this.message.success('Login successful');
        },
        error: (error) => {
          this.message.error(error.message);
          this.loading.set(false);
        }
      });
    }
  }
  
  loginWithGoogle(): void {
    this.loading.set(true);
    this.authService.signInWithGoogle().subscribe({
      error: (error) => {
        this.message.error(error.message);
        this.loading.set(false);
      }
    });
  }
}
```

## Firestore (Database)

### Firestore Service

```typescript
import { inject, Injectable, signal } from '@angular/core';
import { 
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

export interface Project {
  id?: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private firestore = inject(Firestore);
  private collectionName = 'projects';
  
  projects = signal<Project[]>([]);
  
  // Create
  create(project: Omit<Project, 'id'>): Observable<string> {
    const projectsRef = collection(this.firestore, this.collectionName);
    return from(
      addDoc(projectsRef, {
        ...project,
        createdAt: new Date(),
        updatedAt: new Date()
      }).then(docRef => docRef.id)
    );
  }
  
  // Read - Get single document
  getById(id: string): Observable<Project | null> {
    const docRef = doc(this.firestore, this.collectionName, id);
    return from(
      getDoc(docRef).then(snapshot => {
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() } as Project;
        }
        return null;
      })
    );
  }
  
  // Read - Get all documents
  getAll(): Observable<Project[]> {
    const collectionRef = collection(this.firestore, this.collectionName);
    return from(
      getDocs(collectionRef).then(snapshot => {
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        this.projects.set(projects);
        return projects;
      })
    );
  }
  
  // Read - Query with filters
  query(constraints: QueryConstraint[]): Observable<Project[]> {
    const collectionRef = collection(this.firestore, this.collectionName);
    const q = query(collectionRef, ...constraints);
    
    return from(
      getDocs(q).then(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[]
      )
    );
  }
  
  // Update
  update(id: string, data: Partial<Project>): Observable<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    return from(
      updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      })
    );
  }
  
  // Delete
  delete(id: string): Observable<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    return from(deleteDoc(docRef));
  }
  
  // Query active projects
  getActiveProjects(): Observable<Project[]> {
    return this.query([
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(50)
    ]);
  }
}
```

### Firestore Component Usage

```typescript
import { Component, inject, signal, OnInit } from '@angular/core';
import { ProjectService, Project } from '@core/services/project.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="Projects">
      <button nz-button nzType="primary" (click)="createProject()">
        New Project
      </button>
      
      <nz-table [nzData]="projects()" [nzLoading]="loading()">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let project of projects()">
            <td>{{ project.name }}</td>
            <td>{{ project.description }}</td>
            <td>{{ project.status }}</td>
            <td>
              <a (click)="edit(project)">Edit</a>
              <nz-divider nzType="vertical"></nz-divider>
              <a (click)="delete(project)">Delete</a>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private message = inject(NzMessageService);
  
  loading = signal(false);
  projects = this.projectService.projects;
  
  ngOnInit(): void {
    this.loadProjects();
  }
  
  loadProjects(): void {
    this.loading.set(true);
    this.projectService.getAll().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (error) => {
        this.message.error('Failed to load projects');
        this.loading.set(false);
      }
    });
  }
  
  createProject(): void {
    // Open modal or navigate to create form
  }
  
  edit(project: Project): void {
    // Open modal or navigate to edit form
  }
  
  delete(project: Project): void {
    if (project.id) {
      this.projectService.delete(project.id).subscribe({
        next: () => {
          this.message.success('Project deleted');
          this.loadProjects();
        },
        error: (error) => {
          this.message.error('Failed to delete project');
        }
      });
    }
  }
}
```

## Storage (File Upload)

### Storage Service

```typescript
import { inject, Injectable, signal } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask
} from '@angular/fire/storage';
import { Observable, from } from 'rxjs';

export interface UploadProgress {
  progress: number;
  downloadURL?: string;
}

@Injectable({ providedIn: 'root' })
export class FirebaseStorageService {
  private storage = inject(Storage);
  
  uploadProgress = signal<number>(0);
  
  // Upload file with progress tracking
  uploadFile(
    path: string, 
    file: File
  ): Observable<UploadProgress> {
    const storageRef = ref(this.storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Observable(observer => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          this.uploadProgress.set(progress);
          observer.next({ progress });
        },
        (error) => {
          observer.error(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          observer.next({ progress: 100, downloadURL });
          observer.complete();
        }
      );
    });
  }
  
  // Get download URL
  getDownloadURL(path: string): Observable<string> {
    const storageRef = ref(this.storage, path);
    return from(getDownloadURL(storageRef));
  }
  
  // Delete file
  deleteFile(path: string): Observable<void> {
    const storageRef = ref(this.storage, path);
    return from(deleteObject(storageRef));
  }
}
```

### Upload Component

```typescript
import { Component, inject, signal } from '@angular/core';
import { FirebaseStorageService } from '@core/services/firebase-storage.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="File Upload">
      <nz-upload
        nzType="drag"
        [nzBeforeUpload]="beforeUpload"
        [nzShowUploadList]="false"
      >
        <p class="ant-upload-drag-icon">
          <span nz-icon nzType="inbox"></span>
        </p>
        <p class="ant-upload-text">Click or drag file to upload</p>
      </nz-upload>
      
      <nz-progress 
        *ngIf="uploading()" 
        [nzPercent]="uploadProgress()"
      ></nz-progress>
      
      <div *ngIf="downloadURL()">
        <p>Upload complete!</p>
        <a [href]="downloadURL()" target="_blank">View File</a>
      </div>
    </nz-card>
  `
})
export class FileUploadComponent {
  private storageService = inject(FirebaseStorageService);
  private message = inject(NzMessageService);
  
  uploading = signal(false);
  uploadProgress = signal(0);
  downloadURL = signal<string | null>(null);
  
  beforeUpload = (file: NzUploadFile): boolean => {
    this.uploadFile(file as any);
    return false; // Prevent auto upload
  };
  
  uploadFile(file: File): void {
    this.uploading.set(true);
    this.downloadURL.set(null);
    
    const path = `uploads/${Date.now()}_${file.name}`;
    
    this.storageService.uploadFile(path, file).subscribe({
      next: (progress) => {
        this.uploadProgress.set(progress.progress);
        if (progress.downloadURL) {
          this.downloadURL.set(progress.downloadURL);
          this.message.success('Upload complete!');
        }
      },
      error: (error) => {
        this.message.error('Upload failed');
        this.uploading.set(false);
      },
      complete: () => {
        this.uploading.set(false);
      }
    });
  }
}
```

## Best Practices

### Error Handling

```typescript
import { Injectable } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';

@Injectable({ providedIn: 'root' })
export class FirebaseErrorHandler {
  handleError(error: FirebaseError): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'User not found';
      case 'auth/wrong-password':
        return 'Invalid password';
      case 'auth/email-already-in-use':
        return 'Email already registered';
      case 'permission-denied':
        return 'Permission denied';
      case 'not-found':
        return 'Document not found';
      default:
        return error.message || 'An error occurred';
    }
  }
}
```

### Security Rules

**Firestore Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects - authenticated users only
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null 
        && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

**Storage Rules**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Performance Optimization

1. **Use Indexes**: Create composite indexes for complex queries
2. **Pagination**: Implement cursor-based pagination for large datasets
3. **Caching**: Use `@delon/cache` to cache Firebase data
4. **Batch Operations**: Use batch writes for multiple updates
5. **Realtime Listeners**: Unsubscribe from listeners when not needed

### Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideFirebaseApp(() => initializeApp({ /* test config */ })),
        provideFirestore(() => getFirestore()),
        ProjectService
      ]
    });
    
    service = TestBed.inject(ProjectService);
  });
  
  it('should create project', (done) => {
    const project = {
      name: 'Test Project',
      description: 'Test Description',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    service.create(project).subscribe({
      next: (id) => {
        expect(id).toBeTruthy();
        done();
      }
    });
  });
});
```

## Integration with Supabase

When using both Firebase and Supabase:

1. **Use Firebase for**: Authentication, file storage, real-time notifications
2. **Use Supabase for**: Relational data, complex queries, RLS policies
3. **Sync User Data**: Create Supabase user profile when Firebase user is created
4. **Unified Auth**: Use Firebase Auth tokens with Supabase JWT validation

## Additional Resources

- AngularFire Documentation: https://github.com/angular/angularfire
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com
```
