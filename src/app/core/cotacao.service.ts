import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cotacao } from './models';
import { API_BASE } from './api-base';

@Injectable({ providedIn: 'root' })
export class CotacaoService {
  private http = inject(HttpClient);
  private url = `${API_BASE}/cotacoes`;

  listar(): Observable<Cotacao[]> {
    return this.http.get<Cotacao[]>(this.url);
  }

  criar(cotacao: Cotacao): Observable<Cotacao> {
    return this.http.post<Cotacao>(this.url, cotacao);
  }

  atualizar(id: number, cotacao: Cotacao): Observable<Cotacao> {
    return this.http.put<Cotacao>(`${this.url}/${id}`, cotacao);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  marcarEscolhido(id: number): Observable<Cotacao> {
    return this.http.patch<Cotacao>(`${this.url}/${id}/escolher`, {});
  }
}
