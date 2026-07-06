import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Cotacao } from './models';

const CHAVE_STORAGE = 'obra-da-casa:cotacoes';

@Injectable({ providedIn: 'root' })
export class CotacaoService {

  listar(): Observable<Cotacao[]> {
    return of(this.lerTodas());
  }

  criar(cotacao: Cotacao): Observable<Cotacao> {
    const todas = this.lerTodas();
    const novoId = todas.length > 0 ? Math.max(...todas.map(c => c.id ?? 0)) + 1 : 1;
    const nova: Cotacao = { ...cotacao, id: novoId };
    todas.push(nova);
    this.salvarTodas(todas);
    return of(nova);
  }

  atualizar(id: number, cotacao: Cotacao): Observable<Cotacao> {
    const todas = this.lerTodas();
    const index = todas.findIndex(c => c.id === id);
    const atualizada: Cotacao = { ...cotacao, id };
    if (index >= 0) {
      todas[index] = atualizada;
      this.salvarTodas(todas);
    }
    return of(atualizada);
  }

  excluir(id: number): Observable<void> {
    const todas = this.lerTodas().filter(c => c.id !== id);
    this.salvarTodas(todas);
    return of(undefined);
  }

  marcarEscolhido(id: number): Observable<void> {
    const todas = this.lerTodas();
    const alvo = todas.find(c => c.id === id);
    if (!alvo) { return of(undefined); }

    const novoValor = !alvo.escolhido;

    todas
      .filter(c => c.categoria === alvo.categoria && c.subcategoria === alvo.subcategoria)
      .forEach(c => c.escolhido = c.id === id ? novoValor : false);

    this.salvarTodas(todas);
    return of(undefined);
  }

  private lerTodas(): Cotacao[] {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) { return []; }
    try {
      return JSON.parse(bruto) as Cotacao[];
    } catch {
      return [];
    }
  }

  private salvarTodas(cotacoes: Cotacao[]): void {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(cotacoes));
  }
}
