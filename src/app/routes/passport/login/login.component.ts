import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseAuthService, StartupService } from '@core';
import { ReuseTabService } from '@delon/abc/reuse-tab';
import { I18nPipe, SettingsService } from '@delon/theme';
import { environment } from '@env/environment';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'passport-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    I18nPipe,
    NzCheckboxModule,
    NzAlertModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzToolTipModule,
    NzIconModule
  ]
})
export class UserLoginComponent {
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);
  private readonly reuseTabService = inject(ReuseTabService, { optional: true });
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly startupSrv = inject(StartupService);
  private readonly cdr = inject(ChangeDetectorRef);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });
  error = '';
  loading = false;

  async submit(): Promise<void> {
    this.error = '';
    const { email, password } = this.form.controls;
    email.markAsDirty();
    email.updateValueAndValidity();
    password.markAsDirty();
    password.updateValueAndValidity();
    
    if (email.invalid || password.invalid) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    try {
      // Sign in with Firebase Auth
      await this.firebaseAuth.signInWithEmailAndPassword(
        this.form.value.email!,
        this.form.value.password!
      );

      // Clear reuse tab info
      this.reuseTabService?.clear();

      // Reload startup service to refresh user permissions
      this.startupSrv.load().subscribe(() => {
        // Navigate to home page
        this.router.navigateByUrl('/');
      });
    } catch (error: any) {
      this.error = error.message;
      this.cdr.detectChanges();
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
