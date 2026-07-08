import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Fornecedor } from './models';

const CHAVE_STORAGE = 'obra-da-casa:fornecedores';

@Injectable({ providedIn: 'root' })
export class FornecedorService {

  listar(): Observable<Fornecedor[]> {
    return of(this.lerTodos());
  }

  criar(fornecedor: Fornecedor): Observable<Fornecedor> {
    const todos = this.lerTodos();
    const novoId = todos.length > 0 ? Math.max(...todos.map(f => f.id ?? 0)) + 1 : 1;
    const novo: Fornecedor = { ...fornecedor, id: novoId };
    todos.push(novo);
    this.salvarTodos(todos);
    return of(novo);
  }

  atualizar(id: number, fornecedor: Fornecedor): Observable<Fornecedor> {
    const todos = this.lerTodos();
    const index = todos.findIndex(f => f.id === id);
    const atualizado: Fornecedor = { ...fornecedor, id };
    if (index >= 0) {
      todos[index] = atualizado;
      this.salvarTodos(todos);
    }
    return of(atualizado);
  }

  excluir(id: number): Observable<void> {
    const todos = this.lerTodos().filter(f => f.id !== id);
    this.salvarTodos(todos);
    return of(undefined);
  }

  private lerTodos(): Fornecedor[] {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) { return []; }
    try {
      return JSON.parse(bruto) as Fornecedor[];
    } catch {
      return [];
    }
  }

  private salvarTodos(fornecedores: Fornecedor[]): void {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(fornecedores));
  }
}
