import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
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
 * Serviço de autenticação. Por padrão espera um endpoint `${API_BASE}/auth/login`
 * que recebe { email, senha } e devolve { token }. Ajuste a URL e o formato de
 * resposta conforme o backend real do projeto.
 *
 * MODO SEM BACKEND: enquanto MODO_MOCK estiver true, se a chamada ao backend
 * falhar (ele ainda não existe/não está rodando), o login é aceito localmente
 * com um token fake, só pra você conseguir testar a navegação do sistema.
 * Quando o backend estiver pronto, troque MODO_MOCK para false.
 */
const MODO_MOCK = true;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private url = `${API_BASE}/auth/login`;

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.url, payload).pipe(
      tap(resposta => this.salvarToken(resposta.token)),
      catchError(erro => {
        if (MODO_MOCK && payload.email && payload.senha) {
          const respostaFake: LoginResponse = { token: 'token-mock-desenvolvimento' };
          this.salvarToken(respostaFake.token);
          return of(respostaFake);
        }
        throw erro;
      })
    );
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
