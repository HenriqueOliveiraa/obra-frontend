import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';
import { DiaTrabalho } from './models';

@Injectable({ providedIn: 'root' })
export class DiaTrabalhoService {
  private http = inject(HttpClient);
  private url = `${API_BASE}/dias-trabalho`;

  listarPorMes(ano: number, mes: number): Observable<DiaTrabalho[]> {
    return this.http.get<DiaTrabalho[]>(this.url, { params: { ano, mes } });
  }

  criar(dia: DiaTrabalho): Observable<DiaTrabalho> {
    return this.http.post<DiaTrabalho>(this.url, dia);
  }

  atualizar(id: number, dia: DiaTrabalho): Observable<DiaTrabalho> {
    return this.http.put<DiaTrabalho>(`${this.url}/${id}`, dia);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
