import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth.service';

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
  emTelaDeLogin = signal(false);
  menuMobileAberto = signal(false);

  constructor(private router: Router, private auth: AuthService) {
    this.emTelaDeLogin.set(this.router.url.startsWith('/login'));

    this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe(evento => {
        this.emTelaDeLogin.set(evento.urlAfterRedirects.startsWith('/login'));
        this.menuMobileAberto.set(false);
      });
  }

  expandirSidebar(): void {
    this.sidebarCollapsed.set(false);
  }

  recolherSidebar(): void {
    this.sidebarCollapsed.set(true);
  }

  abrirMenuMobile(): void {
    this.menuMobileAberto.set(true);
  }

  fecharMenuMobile(): void {
    this.menuMobileAberto.set(false);
  }

  alternarMenuMobile(): void {
    this.menuMobileAberto.update(valor => !valor);
  }

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
