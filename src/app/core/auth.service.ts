import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { API_BASE } from './api-base';

const CHAVE_TOKEN = 'obra-da-casa:token';

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
}

/**
 * Serviço de autenticação.
 *
 * MODO SEM BACKEND: enquanto MODO_MOCK estiver true, o login é validado
 * localmente aceitando SOMENTE as credenciais abaixo (admin@gmail.com / 12345678).
 * Qualquer outra combinação retorna erro, simulando uma resposta 401 do backend.
 *
 * Quando o backend estiver pronto, troque MODO_MOCK para false para usar
 * a chamada real via HttpClient.
 */
const MODO_MOCK = true;

const EMAIL_MOCK = 'admin@gmail.com';
const SENHA_MOCK = '12345678';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private url = `${API_BASE}/auth/login`;

  login(payload: LoginPayload): Observable<LoginResponse> {
    if (MODO_MOCK) {
      const credenciaisValidas =
        payload.email === EMAIL_MOCK && payload.senha === SENHA_MOCK;

      if (credenciaisValidas) {
        const respostaFake: LoginResponse = { token: 'token-mock-desenvolvimento' };
        this.salvarToken(respostaFake.token);
        // delay simula latência de rede
        return of(respostaFake).pipe(delay(400));
      }

      return throwError(() => new Error('Credenciais inválidas')).pipe(delay(400));
    }

    // Fluxo real (quando MODO_MOCK = false)
    return this.http.post<LoginResponse>(this.url, payload);
  }

  logout(): void {
    localStorage.removeItem(CHAVE_TOKEN);
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem(CHAVE_TOKEN);
  }

  obterToken(): string | null {
    return localStorage.getItem(CHAVE_TOKEN);
  }

  private salvarToken(token: string): void {
    localStorage.setItem(CHAVE_TOKEN, token);
  }
}
