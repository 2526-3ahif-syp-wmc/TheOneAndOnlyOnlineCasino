import { Component, inject } from '@angular/core';
import { AlertService } from '../services/alert-service';

@Component({
  selector: 'app-contact-page',
  imports: [],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss',
})
export class ContactPage {
  protected alertService = inject(AlertService);

  protected sendMessage() {
    this.alertService.info("Message sent!");
  }
}
