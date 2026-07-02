import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';
import { Dashboard, Gasto, Pagina, ResumoGastos } from './models';

@Injectable({ providedIn: 'root' })
export class GastoService {
  private http = inject(HttpClient);
  private url = `${API_BASE}/gastos`;

  listar(): Observable<Pagina<Gasto>> {
    return this.http.get<Pagina<Gasto>>(this.url, { params: { size: 100 } });
  }

  resumo(): Observable<ResumoGastos> {
    return this.http.get<ResumoGastos>(`${this.url}/resumo`);
  }

  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.url}/dashboard`);
  }

  criar(gasto: Gasto): Observable<Gasto> {
    return this.http.post<Gasto>(this.url, gasto);
  }

  atualizar(id: number, gasto: Gasto): Observable<Gasto> {
    return this.http.put<Gasto>(`${this.url}/${id}`, gasto);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  pagarParcela(gastoId: number, parcelaId: number): Observable<void> {
    return this.http.patch<void>(`${this.url}/${gastoId}/parcelas/${parcelaId}/pagar`, {});
  }
}
