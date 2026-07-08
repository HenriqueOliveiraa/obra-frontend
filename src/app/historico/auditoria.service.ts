// auditoria.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuditoriaEvento,
  EntidadeResumo,
  FiltroAuditoria,
  RespostaPaginada,
  UsuarioResumo,
} from './auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/auditoria'; // ajuste para a URL real da API

  listar(filtro: FiltroAuditoria): Observable<RespostaPaginada<AuditoriaEvento>> {
    let params = new HttpParams()
      .set('pagina', filtro.pagina)
      .set('tamanhoPagina', filtro.tamanhoPagina);

    if (filtro.usuarioId) params = params.set('usuarioId', filtro.usuarioId);
    if (filtro.entidade) params = params.set('entidade', filtro.entidade);
    if (filtro.acao) params = params.set('acao', filtro.acao);
    if (filtro.dataInicio) params = params.set('dataInicio', filtro.dataInicio);
    if (filtro.dataFim) params = params.set('dataFim', filtro.dataFim);
    if (filtro.busca) params = params.set('busca', filtro.busca);

    return this.http.get<RespostaPaginada<AuditoriaEvento>>(this.baseUrl, { params });
  }

  listarUsuarios(): Observable<UsuarioResumo[]> {
    return this.http.get<UsuarioResumo[]>(`${this.baseUrl}/usuarios`);
  }

  listarEntidades(): Observable<EntidadeResumo[]> {
    return this.http.get<EntidadeResumo[]>(`${this.baseUrl}/entidades`);
  }

  historicoDoRegistro(entidade: string, entidadeId: string): Observable<AuditoriaEvento[]> {
    return this.http.get<AuditoriaEvento[]>(`${this.baseUrl}/${entidade}/${entidadeId}`);
  }
}
