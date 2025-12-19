import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  isRegister = false;
  error = '';

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    displayName: [''],
    password: ['', Validators.required],
    remember: [true],
  });

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      this.form.patchValue({ email: rememberedEmail, remember: rememberMe });
    } else {
      this.form.patchValue({ remember: true });
    }
  }

  submit() {
    if (this.form.invalid) return;

    const { email, password, remember, displayName } = this.form.value;
    const rememberMe = remember ?? true;

    if (this.isRegister) {
      this.auth.register(email!, password!, displayName?.trim()).subscribe({
        next: () => {
          this.isRegister = false;
          this.error = 'Registration successful! Please login.';
          this.form.reset({ remember: true });
          this.setRegisterValidators(false);
        },
        error: (err) => (this.error = err.error?.message || 'Registration failed'),
      });
    } else {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        if (email) {
          localStorage.setItem('rememberEmail', email);
        }
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberEmail');
      }

      this.auth.login(email!, password!, rememberMe).subscribe({
        next: () => this.router.navigateByUrl('/dashboard'),
        error: () => (this.error = 'Invalid credentials'),
      });
    }
  }

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.error = '';
    this.form.reset({ remember: true });
    this.setRegisterValidators(this.isRegister);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  private setRegisterValidators(enable: boolean) {
    const nameControl = this.form.get('displayName');
    if (!nameControl) return;
    if (enable) {
      nameControl.setValidators([Validators.required]);
    } else {
      nameControl.clearValidators();
    }
    nameControl.updateValueAndValidity();
  }
}
