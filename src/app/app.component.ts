import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Obra da Casa';
  sidebarCollapsed = signal(true);

  expandirSidebar(): void {
    this.sidebarCollapsed.set(false);
  }

  recolherSidebar(): void {
    this.sidebarCollapsed.set(true);
  }
}
