import { Component } from '@angular/core';
import { NavShellComponent } from './shared/nav-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavShellComponent],
  template: `<app-nav-shell></app-nav-shell>`,
  styles: [`:host { display: block; height: 100vh; }`]
})
export class App {}
