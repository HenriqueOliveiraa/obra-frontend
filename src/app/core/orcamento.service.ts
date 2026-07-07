import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { OrcamentoConfig } from './models';
import { API_BASE } from './api-base';

interface OrcamentoConfigAPI {
  orcamentoTotal: number;
  tetoMaterial: number;
  tetoMaoDeObra: number;
  tetoTransporte: number;
  tetoOutros: number;
  margemTolerancia: number;
}

@Injectable({ providedIn: 'root' })
export class OrcamentoService {
  private http = inject(HttpClient);
  private url = `${API_BASE}/orcamento-config`;

  obterConfig(): Observable<OrcamentoConfig> {
    return this.http.get<OrcamentoConfigAPI>(this.url).pipe(
      map(api => this.fromAPI(api))
    );
  }

  salvarConfig(config: OrcamentoConfig): Observable<OrcamentoConfig> {
    return this.http.put<OrcamentoConfigAPI>(this.url, this.toAPI(config)).pipe(
      map(api => this.fromAPI(api))
    );
  }

  private fromAPI(api: OrcamentoConfigAPI): OrcamentoConfig {
    return {
      orcamentoTotal: api.orcamentoTotal,
      tetoPorCategoria: {
        MATERIAL: api.tetoMaterial,
        MAO_DE_OBRA: api.tetoMaoDeObra,
        TRANSPORTE: api.tetoTransporte,
        OUTROS: api.tetoOutros
      },
      margemtolerancia: api.margemTolerancia
    };
  }

  private toAPI(config: OrcamentoConfig): OrcamentoConfigAPI {
    return {
      orcamentoTotal: config.orcamentoTotal,
      tetoMaterial: config.tetoPorCategoria?.MATERIAL ?? 0,
      tetoMaoDeObra: config.tetoPorCategoria?.MAO_DE_OBRA ?? 0,
      tetoTransporte: config.tetoPorCategoria?.TRANSPORTE ?? 0,
      tetoOutros: config.tetoPorCategoria?.OUTROS ?? 0,
      margemTolerancia: config.margemtolerancia ?? 0
    };
  }
}
