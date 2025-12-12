import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  isRegister = false;
  error = '';

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;

    if (this.isRegister) {
      this.auth.register(email!, password!).subscribe({
        next: () => {
          this.isRegister = false;
          this.error = 'Registration successful! Please login.';
          this.form.reset();
        },
        error: (err) => (this.error = err.error?.message || 'Registration failed'),
      });
    } else {
      this.auth.login(email!, password!).subscribe({
        next: () => this.router.navigateByUrl('/dashboard'),
        error: () => (this.error = 'Invalid credentials'),
      });
    }
  }

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.error = '';
    this.form.reset();
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
