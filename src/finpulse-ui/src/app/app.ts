import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavShellComponent } from './shared/nav-shell.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavShellComponent],
  template: `
    @if (showShell) {
      <app-nav-shell></app-nav-shell>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`:host { display: block; height: 100vh; }`]
})
export class App implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  showShell = false;

  ngOnInit(): void {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(event => {
      this.showShell = !event.urlAfterRedirects.startsWith('/login');
    });
  }
}
