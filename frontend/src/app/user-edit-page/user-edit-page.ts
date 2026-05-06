import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user-service';

@Component({
  selector: 'app-user-edit-page',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-edit-page.html',
  styleUrl: './user-edit-page.scss',
})
export class UserEditPage implements OnInit {
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);

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

    const username = this.editForm.get('username')?.value;
    const currentPassword = this.editForm.get('currentPassword')?.value;

    const newPasswordValue = this.editForm.get('newPassword')?.value;

    this.userService.updateProfile(username, currentPassword, newPasswordValue)
      .subscribe({
        next: () => {
          this.successMessage = 'Profile updated successfully!';
          setTimeout(() => {
            window.location.href = '/user-profile';
          }, 1200);
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Failed to update profile. Please try again.';
          this.errorMessage = msg;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
  }
}
