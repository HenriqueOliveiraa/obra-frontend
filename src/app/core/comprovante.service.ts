import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comprovante } from './models';
import { API_BASE } from './api-base';

@Injectable({ providedIn: 'root' })
export class ComprovanteService {
  private http = inject(HttpClient);
  private url = `${API_BASE}/comprovantes`;

  listar(): Observable<Comprovante[]> {
    return this.http.get<Comprovante[]>(this.url);
  }

  buscarPorGasto(gastoId: number): Observable<Comprovante> {
    return this.http.get<Comprovante>(`${this.url}/gasto/${gastoId}`);
  }

  salvar(comprovante: Comprovante): Observable<Comprovante> {
    return this.http.post<Comprovante>(this.url, comprovante);
  }

  remover(gastoId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/gasto/${gastoId}`);
  }
}
