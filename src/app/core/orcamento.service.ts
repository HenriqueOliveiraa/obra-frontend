import { Injectable } from '@angular/core';
import { Categoria, OrcamentoConfig } from './models';

const CHAVE_STORAGE = 'obra-da-casa:orcamento-config';

const CONFIG_PADRAO: OrcamentoConfig = {
  orcamentoTotal: 0,
  tetoPorCategoria: {
    MATERIAL: 0,
    MAO_DE_OBRA: 0,
    TRANSPORTE: 0,
    OUTROS: 0
  },
  margemtolerancia: 0
};

@Injectable({ providedIn: 'root' })
export class OrcamentoService {

  obterConfig(): OrcamentoConfig {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) {
      return this.clonar(CONFIG_PADRAO);
    }

    try {
      const salvo = JSON.parse(bruto) as Partial<OrcamentoConfig>;
      const categorias: Categoria[] = ['MATERIAL', 'MAO_DE_OBRA', 'TRANSPORTE', 'OUTROS'];
      const tetoPorCategoria = {} as Record<Categoria, number>;

      categorias.forEach(categoria => {
        tetoPorCategoria[categoria] = Number(salvo.tetoPorCategoria?.[categoria] ?? 0);
      });

      return {
        orcamentoTotal: Number(salvo.orcamentoTotal ?? 0),
        tetoPorCategoria,
        margemtolerancia: Number(salvo.margemtolerancia ?? 0)
      };
    } catch {
      return this.clonar(CONFIG_PADRAO);
    }
  }

  salvarConfig(config: OrcamentoConfig): void {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(config));
  }

  private clonar(config: OrcamentoConfig): OrcamentoConfig {
    return {
      orcamentoTotal: config.orcamentoTotal,
      tetoPorCategoria: { ...config.tetoPorCategoria },
      margemtolerancia: config.margemtolerancia
    };
  }
}
