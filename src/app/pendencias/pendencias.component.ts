import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ComprovanteService } from '../core/comprovante.service';
import { CotacaoService } from '../core/cotacao.service';
import { EtapaGastoService, ClassificacaoGasto } from '../core/etapa-gasto.service';
import { GastoService } from '../core/gasto.service';
import { ListaComprasService } from '../core/lista-compras.service';
import { Comprovante, Cotacao, Gasto, ItemCompra, Parcela } from '../core/models';

type Severidade = 'critica' | 'alerta' | 'info' | 'ok';

interface ParcelaComGasto {
  gasto: Gasto;
  parcela: Parcela;
  diasAteVencimento: number;
}

interface CardAtencao {
  titulo: string;
  valor: number | string;
  detalhe: string;
  severidade: Severidade;
  rota: string;
  pendencia: string;
}

interface SecaoPendencia {
  titulo: string;
  descricao: string;
  quantidade: number;
  severidade: Severidade;
  rota: string;
  pendencia: string;
}

@Component({
  selector: 'app-pendencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pendencias.component.html',
  styleUrl: './pendencias.component.css'
})
export class PendenciasComponent implements OnInit {
  private gastoService = inject(GastoService);
  private listaComprasService = inject(ListaComprasService);
  private cotacaoService = inject(CotacaoService);
  private comprovanteService = inject(ComprovanteService);
  private etapaGastoService = inject(EtapaGastoService);
  private router = inject(Router);

  gastos: Gasto[] = [];
  itensCompra: ItemCompra[] = [];
  cotacoes: Cotacao[] = [];
  comprovantes: Comprovante[] = [];
  classificacoesPorGasto: Record<number, ClassificacaoGasto> = {};

  carregando = true;
  erro = '';

  ngOnInit(): void {
    this.carregarPendencias();
  }

  carregarPendencias(): void {
    this.carregando = true;
    this.erro = '';

    forkJoin({
      paginaGastos: this.gastoService.listar(),
      itensCompra: this.listaComprasService.listar(),
      cotacoes: this.cotacaoService.listar(),
      comprovantes: this.comprovanteService.listar(),
      classificacoes: this.etapaGastoService.listar()
    }).subscribe({
      next: resultado => {
        this.gastos = resultado.paginaGastos.content;
        this.itensCompra = resultado.itensCompra;
        this.cotacoes = resultado.cotacoes;
        this.comprovantes = resultado.comprovantes;
        this.classificacoesPorGasto = resultado.classificacoes;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar as pendências agora.';
        this.carregando = false;
      }
    });
  }

  get parcelasVencidas(): ParcelaComGasto[] {
    return this.parcelasPendentes().filter(item => item.diasAteVencimento < 0);
  }

  get parcelasVencendo7Dias(): ParcelaComGasto[] {
    return this.parcelasPendentes().filter(item => item.diasAteVencimento >= 0 && item.diasAteVencimento <= 7);
  }

  get parcelasVencendo15Dias(): ParcelaComGasto[] {
    return this.parcelasPendentes().filter(item => item.diasAteVencimento >= 8 && item.diasAteVencimento <= 15);
  }

  get parcelasVencendo30Dias(): ParcelaComGasto[] {
    return this.parcelasPendentes().filter(item => item.diasAteVencimento >= 16 && item.diasAteVencimento <= 30);
  }

  get comprasPendentes(): ItemCompra[] {
    return this.itensCompra.filter(item => !item.comprado);
  }

  get cotacoesEscolhidas(): Cotacao[] {
    return this.cotacoes.filter(cotacao => cotacao.escolhido);
  }

  get materiaisAguardandoEntrega(): Gasto[] {
    return this.gastos.filter(gasto => gasto.categoria === 'MATERIAL' && gasto.statusMaterial === 'A_CAMINHO');
  }

  get materiaisSemResponsavel(): Gasto[] {
    return this.gastos.filter(gasto =>
      gasto.categoria === 'MATERIAL' &&
      gasto.statusMaterial === 'ENTREGUE' &&
      !gasto.responsavelRecebimento?.trim()
    );
  }

  get gastosSemComprovante(): Gasto[] {
    const gastosComComprovante = new Set(this.comprovantes.map(comprovante => comprovante.gastoId));
    return this.gastos.filter(gasto => !!gasto.id && !gastosComComprovante.has(gasto.id));
  }

  get gastosSemClassificacao(): Gasto[] {
    return this.gastos.filter(gasto => !!gasto.id && !this.classificacoesPorGasto[gasto.id]);
  }

  get valorComprometido(): number {
    return [
      ...this.parcelasVencidas,
      ...this.parcelasVencendo7Dias,
      ...this.parcelasVencendo15Dias,
      ...this.parcelasVencendo30Dias
    ].reduce((total, item) => total + item.parcela.valor, 0);
  }

  get totalPendencias(): number {
    return this.cardsAtencao.reduce((total, card) => total + Number(card.valor || 0), 0);
  }

  get temPendenciasCriticas(): boolean {
    return this.parcelasVencidas.length > 0;
  }

  get cardsAtencao(): CardAtencao[] {
    return [
      {
        titulo: 'Parcelas vencidas',
        valor: this.parcelasVencidas.length,
        detalhe: 'pagamentos que já passaram da data',
        severidade: this.parcelasVencidas.length > 0 ? 'critica' : 'ok',
        rota: '/financeiro',
        pendencia: 'parcelas-vencidas'
      },
      {
        titulo: 'Vencem em 7 dias',
        valor: this.parcelasVencendo7Dias.length,
        detalhe: 'parcelas que precisam de atenção imediata',
        severidade: this.parcelasVencendo7Dias.length > 0 ? 'alerta' : 'ok',
        rota: '/financeiro',
        pendencia: 'parcelas-7-dias'
      },
      {
        titulo: 'Materiais aguardando entrega',
        valor: this.materiaisAguardandoEntrega.length,
        detalhe: 'compras marcadas como a caminho',
        severidade: this.materiaisAguardandoEntrega.length > 0 ? 'alerta' : 'ok',
        rota: '/gastos',
        pendencia: 'materiais-aguardando'
      },
      {
        titulo: 'Gastos sem comprovante',
        valor: this.gastosSemComprovante.length,
        detalhe: 'lançamentos sem anexo registrado',
        severidade: this.gastosSemComprovante.length > 0 ? 'info' : 'ok',
        rota: '/gastos',
        pendencia: 'sem-comprovante'
      },
      {
        titulo: 'Gastos sem classificação',
        valor: this.gastosSemClassificacao.length,
        detalhe: 'itens sem etapa/subcategoria definida',
        severidade: this.gastosSemClassificacao.length > 0 ? 'info' : 'ok',
        rota: '/gastos',
        pendencia: 'sem-classificacao'
      },
      {
        titulo: 'Compras pendentes',
        valor: this.comprasPendentes.length,
        detalhe: 'itens ainda não marcados como comprados',
        severidade: this.comprasPendentes.length > 0 ? 'alerta' : 'ok',
        rota: '/lista-compras',
        pendencia: 'pendentes'
      }
    ];
  }

  get secoesComPendencia(): SecaoPendencia[] {
    const secoes: SecaoPendencia[] = [
      {
        titulo: 'Parcelas vencidas',
        descricao: 'Pagamentos que já passaram da data de vencimento.',
        quantidade: this.parcelasVencidas.length,
        severidade: 'critica',
        rota: '/financeiro',
        pendencia: 'parcelas-vencidas'
      },
      {
        titulo: 'Parcelas vencendo em até 7 dias',
        descricao: 'Compromissos financeiros mais próximos.',
        quantidade: this.parcelasVencendo7Dias.length,
        severidade: 'alerta',
        rota: '/financeiro',
        pendencia: 'parcelas-7-dias'
      },
      {
        titulo: 'Parcelas vencendo entre 8 e 15 dias',
        descricao: 'Pagamentos para acompanhar ainda neste ciclo.',
        quantidade: this.parcelasVencendo15Dias.length,
        severidade: 'info',
        rota: '/financeiro',
        pendencia: 'parcelas-15-dias'
      },
      {
        titulo: 'Parcelas vencendo entre 16 e 30 dias',
        descricao: 'Compromissos do mês que já podem ser planejados.',
        quantidade: this.parcelasVencendo30Dias.length,
        severidade: 'info',
        rota: '/financeiro',
        pendencia: 'parcelas-30-dias'
      },
      {
        titulo: 'Materiais aguardando entrega',
        descricao: 'Gastos de material com status A caminho.',
        quantidade: this.materiaisAguardandoEntrega.length,
        severidade: 'alerta',
        rota: '/gastos',
        pendencia: 'materiais-aguardando'
      },
      {
        titulo: 'Materiais entregues sem responsável',
        descricao: 'Materiais entregues que ainda não registram quem recebeu.',
        quantidade: this.materiaisSemResponsavel.length,
        severidade: 'info',
        rota: '/gastos',
        pendencia: 'sem-responsavel'
      },
      {
        titulo: 'Gastos sem comprovante',
        descricao: 'Lançamentos que ainda precisam de nota, foto ou recibo.',
        quantidade: this.gastosSemComprovante.length,
        severidade: 'info',
        rota: '/gastos',
        pendencia: 'sem-comprovante'
      },
      {
        titulo: 'Gastos sem classificação',
        descricao: 'Gastos ainda sem etapa ou subcategoria da obra.',
        quantidade: this.gastosSemClassificacao.length,
        severidade: 'info',
        rota: '/gastos',
        pendencia: 'sem-classificacao'
      },
      {
        titulo: 'Compras pendentes',
        descricao: 'Itens da lista de compras que ainda não foram concluídos.',
        quantidade: this.comprasPendentes.length,
        severidade: 'alerta',
        rota: '/lista-compras',
        pendencia: 'pendentes'
      },
      {
        titulo: 'Cotações escolhidas para conferir',
        descricao: 'Cotações marcadas como escolhidas. O sistema não presume se já viraram gasto.',
        quantidade: this.cotacoesEscolhidas.length,
        severidade: 'info',
        rota: '/orcamentos',
        pendencia: 'cotacoes-escolhidas'
      }
    ];

    return secoes.filter(secao => secao.quantidade > 0);
  }

  abrirPendencia(rota: string, pendencia: string): void {
    this.router.navigate([rota], { queryParams: { pendencia } });
  }

  private parcelasPendentes(): ParcelaComGasto[] {
    return this.gastos.flatMap(gasto => (gasto.parcelas ?? [])
      .filter(parcela => !parcela.pago)
      .map(parcela => ({
        gasto,
        parcela,
        diasAteVencimento: this.diferencaEmDias(parcela.vencimento)
      }))
    ).sort((a, b) => a.diasAteVencimento - b.diasAteVencimento);
  }

  private diferencaEmDias(dataIso: string): number {
    const hoje = this.inicioDoDia(new Date());
    const vencimento = this.inicioDoDia(this.criarDataLocal(dataIso));
    const umDia = 24 * 60 * 60 * 1000;
    return Math.round((vencimento.getTime() - hoje.getTime()) / umDia);
  }

  private criarDataLocal(dataIso: string): Date {
    const [ano, mes, dia] = dataIso.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  private inicioDoDia(data: Date): Date {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
  }
}
