import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CategoriaOrcamento } from './models';

export interface ClassificacaoGasto {
  categoria: CategoriaOrcamento;
  subcategoria: string;
}

const CHAVE_STORAGE = 'obra-da-casa:categoria-gasto';

type MapaClassificacoes = Record<number, ClassificacaoGasto>;

@Injectable({ providedIn: 'root' })
export class EtapaGastoService {

  listar(): Observable<MapaClassificacoes> {
    return of(this.lerTodos());
  }

  obter(gastoId: number | undefined): ClassificacaoGasto | undefined {
    if (!gastoId) { return undefined; }
    return this.lerTodos()[gastoId];
  }

  definir(gastoId: number, classificacao: ClassificacaoGasto | undefined): Observable<void> {
    const todos = this.lerTodos();
    if (classificacao && classificacao.categoria) {
      todos[gastoId] = classificacao;
    } else {
      delete todos[gastoId];
    }
    this.salvarTodos(todos);
    return of(undefined);
  }

  private lerTodos(): MapaClassificacoes {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) { return {}; }
    try {
      return JSON.parse(bruto) as MapaClassificacoes;
    } catch {
      return {};
    }
  }

  private salvarTodos(mapa: MapaClassificacoes): void {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(mapa));
  }
}
