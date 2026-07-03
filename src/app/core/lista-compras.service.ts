import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ItemCompra } from './models';

const CHAVE_STORAGE = 'obra-da-casa:lista-compras';

@Injectable({ providedIn: 'root' })
export class ListaComprasService {

  listar(): Observable<ItemCompra[]> {
    return of(this.lerTodos());
  }

  criar(item: ItemCompra): Observable<ItemCompra> {
    const todos = this.lerTodos();
    const novoId = todos.length > 0 ? Math.max(...todos.map(i => i.id ?? 0)) + 1 : 1;
    const novo: ItemCompra = { ...item, id: novoId };
    todos.push(novo);
    this.salvarTodos(todos);
    return of(novo);
  }

  atualizar(id: number, item: ItemCompra): Observable<ItemCompra> {
    const todos = this.lerTodos();
    const index = todos.findIndex(i => i.id === id);
    const atualizado: ItemCompra = { ...item, id };
    if (index >= 0) {
      todos[index] = atualizado;
      this.salvarTodos(todos);
    }
    return of(atualizado);
  }

  excluir(id: number): Observable<void> {
    const todos = this.lerTodos().filter(i => i.id !== id);
    this.salvarTodos(todos);
    return of(undefined);
  }

  private lerTodos(): ItemCompra[] {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) { return []; }
    try {
      return JSON.parse(bruto) as ItemCompra[];
    } catch {
      return [];
    }
  }

  private salvarTodos(itens: ItemCompra[]): void {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(itens));
  }
}
