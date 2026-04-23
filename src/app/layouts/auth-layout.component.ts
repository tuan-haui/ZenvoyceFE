import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <div class="auth-wrapper">
      <div class="auth-content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
      background: linear-gradient(135deg, #f7f9ff 0%, #ebf2ff 100%);
    }

    .auth-content {
      width: 100%;
      max-width: 440px;
    }
  `]
})
export class AuthLayoutComponent {}
