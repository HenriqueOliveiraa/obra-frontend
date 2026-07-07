import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  senha = '';
  mostrarSenha = false;

  carregando = false;
  erro = '';

  onSubmit(): void {
    if (!this.email || !this.senha) { return; }

    this.erro = '';
    this.carregando = true;

    this.auth.login({ email: this.email, senha: this.senha }).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.carregando = false;
        this.erro = 'E-mail ou senha inválidos.';
      }
    });
  }
}
