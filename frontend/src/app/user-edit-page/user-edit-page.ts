import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { UserService } from '../services/user-service';
import { AlertService } from '../services/alert-service';

@Component({
  selector: 'app-user-edit-page',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-edit-page.html',
  styleUrl: './user-edit-page.scss',
})
export class UserEditPage implements OnInit {
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  isPremium = this.userService.premium;
  editForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.editForm = this.formBuilder.group({
      username: [this.userService.username(), [Validators.required, Validators.minLength(3)]],
      currentPassword: ['', Validators.required],
      newPassword: [''],
      confirmPassword: ['']
    });
  }

  onSubmit() {
    if (!this.editForm.valid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    const username = this.editForm.get('username')?.value.trim();
    const currentPassword = this.editForm.get('currentPassword')?.value;
    const newPassword = this.editForm.get('newPassword')?.value;
    const confirmPassword = this.editForm.get('confirmPassword')?.value;

    // If changing password, validate match
    if (newPassword && newPassword !== confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (newPassword && newPassword.length < 6) {
      this.errorMessage = 'New password must be at least 6 characters';
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.userService.updateProfile({
      username,
      currentPassword,
      newPassword: newPassword?.trim() || undefined
    }).pipe(
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully!';

        setTimeout(() => {
          this.router.navigate(['/user-profile']);
        }, 1500);
      },
      error: (error) => {
        const message = error?.error?.message ?? 'Failed to update profile. Please try again.';

        if (error?.status === 401 || message === 'Current password is incorrect') {
          this.alertService.error('The old password you entered is incorrect.');
        }

        this.errorMessage = message;
      }
    });
  }

  onUnsubscribe() {
    if (!confirm('Are you sure you want to unsubscribe from EduBet+?')) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.unbuyPremium().subscribe({
      next: () => {
        // show alert as requested and update UI
        this.alertService.info('Succesfully unsubscribed');
        this.successMessage = 'You have been unsubscribed from EduBet+';
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Failed to unsubscribe. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}
