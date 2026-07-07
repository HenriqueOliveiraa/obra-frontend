import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ItemCompra } from './models';
import { API_BASE } from './api-base';

@Injectable({ providedIn: 'root' })
export class ListaComprasService {
  private http = inject(HttpClient);
  private url = `${API_BASE}/lista-compras`;

  listar(): Observable<ItemCompra[]> {
    return this.http.get<ItemCompra[]>(this.url);
  }

  criar(item: ItemCompra): Observable<ItemCompra> {
    return this.http.post<ItemCompra>(this.url, item);
  }

  atualizar(id: number, item: ItemCompra): Observable<ItemCompra> {
    return this.http.put<ItemCompra>(`${this.url}/${id}`, item);
  }

  marcarComprado(id: number): Observable<ItemCompra> {
    return this.http.patch<ItemCompra>(`${this.url}/${id}/marcar-comprado`, {});
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
