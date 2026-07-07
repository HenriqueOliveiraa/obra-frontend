import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { GastoService } from './gasto.service';
import { CotacaoService } from './cotacao.service';
import { ComprovanteService } from './comprovante.service';
import { Comprovante, Cotacao, Gasto } from './models';
import { CATEGORIA_CLASSE, CATEGORIA_LABEL } from '../gastos/gastos.component';
import { CATEGORIA_ORCAMENTO_LABEL } from './categorias-orcamento';

export type TimelineTipo =
  | 'COMPRA'
  | 'PAGAMENTO'
  | 'PARCELA_VENCIDA'
  | 'ENTREGA'
  | 'COTACAO_ESCOLHIDA'
  | 'COMPROVANTE';

export const TIMELINE_TIPO_LABEL: Record<TimelineTipo, string> = {
  COMPRA: 'Compra',
  PAGAMENTO: 'Pagamento',
  PARCELA_VENCIDA: 'Parcela vencida',
  ENTREGA: 'Entrega',
  COTACAO_ESCOLHIDA: 'Cotação escolhida',
  COMPROVANTE: 'Comprovante'
};

export const TIMELINE_TIPO_ORDEM: TimelineTipo[] = [
  'COMPRA', 'PAGAMENTO', 'PARCELA_VENCIDA', 'ENTREGA', 'COTACAO_ESCOLHIDA', 'COMPROVANTE'
];

export interface TimelineEvento {
  id: string;
  tipo: TimelineTipo;
  data: string;
  titulo: string;
  descricao?: string;
  fornecedor?: string;
  valor?: number;
  categoriaLabel?: string;
  categoriaClasse?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class TimelineService {
  private gastoService = inject(GastoService);
  private cotacaoService = inject(CotacaoService);
  private comprovanteService = inject(ComprovanteService);

  obterEventos(): Observable<TimelineEvento[]> {
    return forkJoin({
      paginaGastos: this.gastoService.listar(),
      cotacoes: this.cotacaoService.listar(),
      comprovantes: this.comprovanteService.listar()
    }).pipe(
      map(({ paginaGastos, cotacoes, comprovantes }) =>
        this.montarEventos(paginaGastos.content, cotacoes, comprovantes))
    );
  }

  private montarEventos(gastos: Gasto[], cotacoes: Cotacao[], comprovantes: Comprovante[]): TimelineEvento[] {
    const eventos: TimelineEvento[] = [];
    const hoje = this.inicioDoDia(new Date());

    gastos.forEach(gasto => {
      eventos.push({
        id: `compra-${gasto.id}`,
        tipo: 'COMPRA',
        data: gasto.dataCompra,
        titulo: gasto.descricao,
        fornecedor: gasto.fornecedor,
        valor: gasto.valorTotal,
        categoriaLabel: CATEGORIA_LABEL[gasto.categoria],
        categoriaClasse: CATEGORIA_CLASSE[gasto.categoria]
      });

      if (gasto.categoria === 'MATERIAL' && gasto.statusMaterial === 'ENTREGUE') {
        eventos.push({
          id: `entrega-${gasto.id}`,
          tipo: 'ENTREGA',
          data: gasto.dataCompra,
          titulo: `Material entregue: ${gasto.descricao}`,
          fornecedor: gasto.fornecedor,
          categoriaLabel: CATEGORIA_LABEL[gasto.categoria],
          categoriaClasse: CATEGORIA_CLASSE[gasto.categoria],
          status: gasto.responsavelRecebimento ? `Recebido por ${gasto.responsavelRecebimento}` : undefined
        });
      }

      (gasto.parcelas ?? []).forEach(parcela => {
        if (parcela.pago && parcela.dataPagamento) {
          eventos.push({
            id: `pagamento-${gasto.id}-${parcela.id}`,
            tipo: 'PAGAMENTO',
            data: parcela.dataPagamento,
            titulo: `Pagamento: ${gasto.descricao}`,
            descricao: `Parcela #${parcela.numero}`,
            valor: parcela.valor,
            fornecedor: gasto.fornecedor,
            categoriaLabel: CATEGORIA_LABEL[gasto.categoria],
            categoriaClasse: CATEGORIA_CLASSE[gasto.categoria]
          });
        } else if (!parcela.pago && this.diferencaEmDias(parcela.vencimento, hoje) < 0) {
          eventos.push({
            id: `vencida-${gasto.id}-${parcela.id}`,
            tipo: 'PARCELA_VENCIDA',
            data: parcela.vencimento,
            titulo: `Parcela vencida: ${gasto.descricao}`,
            descricao: `Parcela #${parcela.numero}`,
            valor: parcela.valor,
            fornecedor: gasto.fornecedor,
            categoriaLabel: CATEGORIA_LABEL[gasto.categoria],
            categoriaClasse: CATEGORIA_CLASSE[gasto.categoria]
          });
        }
      });
    });

    cotacoes.filter(cotacao => cotacao.escolhido).forEach(cotacao => {
      eventos.push({
        id: `cotacao-${cotacao.id}`,
        tipo: 'COTACAO_ESCOLHIDA',
        data: cotacao.data,
        titulo: `Cotação escolhida: ${cotacao.item}`,
        descricao: cotacao.observacao,
        fornecedor: cotacao.fornecedor,
        valor: cotacao.valor,
        categoriaLabel: CATEGORIA_ORCAMENTO_LABEL[cotacao.categoria]
      });
    });

    comprovantes.forEach(comprovante => {
      const gasto = gastos.find(g => g.id === comprovante.gastoId);
      eventos.push({
        id: `comprovante-${comprovante.gastoId}`,
        tipo: 'COMPROVANTE',
        data: comprovante.dataUpload.slice(0, 10),
        titulo: gasto ? `Comprovante anexado: ${gasto.descricao}` : 'Comprovante anexado',
        fornecedor: gasto?.fornecedor,
        categoriaLabel: gasto ? CATEGORIA_LABEL[gasto.categoria] : undefined,
        categoriaClasse: gasto ? CATEGORIA_CLASSE[gasto.categoria] : undefined
      });
    });

    return eventos.sort((a, b) => b.data.localeCompare(a.data));
  }

  private diferencaEmDias(dataIso: string, hoje: Date): number {
    const alvo = this.inicioDoDia(this.criarDataLocal(dataIso));
    const umDia = 24 * 60 * 60 * 1000;
    return Math.round((alvo.getTime() - hoje.getTime()) / umDia);
  }

  private criarDataLocal(dataIso: string): Date {
    const [ano, mes, dia] = dataIso.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  private inicioDoDia(data: Date): Date {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
  }
}
