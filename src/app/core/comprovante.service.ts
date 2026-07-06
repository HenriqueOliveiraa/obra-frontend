import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Comprovante } from './models';

const CHAVE_STORAGE = 'obra-da-casa:comprovantes';

@Injectable({ providedIn: 'root' })
export class ComprovanteService {

  listar(): Observable<Comprovante[]> {
    return of(this.lerTodos());
  }

  salvar(comprovante: Comprovante): Observable<Comprovante> {
    const todos = this.lerTodos().filter(c => c.gastoId !== comprovante.gastoId);
    todos.push(comprovante);
    this.salvarTodos(todos);
    return of(comprovante);
  }

  remover(gastoId: number): Observable<void> {
    const todos = this.lerTodos().filter(c => c.gastoId !== gastoId);
    this.salvarTodos(todos);
    return of(undefined);
  }

  private lerTodos(): Comprovante[] {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) { return []; }
    try {
      return JSON.parse(bruto) as Comprovante[];
    } catch {
      return [];
    }
  }

  private salvarTodos(comprovantes: Comprovante[]): void {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(comprovantes));
    } catch {
    }
  }
}
