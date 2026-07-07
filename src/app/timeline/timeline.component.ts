import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownOpcao, DropdownSelectComponent } from '../gastos/gastos.component';
import { CampoDetalhe, DetalheModalComponent, GrupoDetalhe } from '../shared/detalhe-modal/detalhe-modal.component';
import {
  TIMELINE_TIPO_LABEL,
  TIMELINE_TIPO_ORDEM,
  TimelineEvento,
  TimelineService,
  TimelineTipo
} from '../core/timeline.service';

const TODOS = 'TODOS';

type FiltroTipo = 'TODOS' | TimelineTipo;

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSelectComponent, DetalheModalComponent],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css'
})
export class TimelineComponent implements OnInit {
  private service = inject(TimelineService);

  eventos: TimelineEvento[] = [];
  carregando = true;
  erro = '';

  filtroTipoOptions: DropdownOpcao[] = [
    { value: TODOS, label: 'Todos os tipos' },
    ...TIMELINE_TIPO_ORDEM.map(tipo => ({ value: tipo, label: TIMELINE_TIPO_LABEL[tipo] }))
  ];

  filtroTipo: FiltroTipo = TODOS;
  busca = '';
  dataInicio = '';
  dataFim = '';

  eventosPorPagina = 5;
  paginaAtualEventos = 1;

  // --- Detalhes (modal reutilizável) ---

  detalhesId: string | null = null;

  abrirDetalhes(evento: TimelineEvento): void {
    this.detalhesId = evento.id;
  }

  fecharDetalhes(): void {
    this.detalhesId = null;
  }

  get eventoDetalhes(): TimelineEvento | undefined {
    return this.eventos.find(evento => evento.id === this.detalhesId);
  }

  get gruposDetalhesEvento(): GrupoDetalhe[] {
    const evento = this.eventoDetalhes;
    if (!evento) { return []; }

    const campos: CampoDetalhe[] = [
      { label: 'Tipo', valor: this.tipoLabel(evento.tipo), tag: true, classeTag: 'timeline-tag-tipo ' + this.tipoClasse(evento.tipo) },
      { label: 'Data', valor: this.formatarDataExibicao(evento.data) }
    ];

    if (evento.descricao) {
      campos.push({ label: 'Descrição', valor: evento.descricao });
    }
    if (evento.categoriaLabel) {
      campos.push({ label: 'Categoria', valor: evento.categoriaLabel, tag: true, classeTag: evento.categoriaClasse });
    }
    if (evento.fornecedor) {
      campos.push({ label: 'Fornecedor', valor: evento.fornecedor });
    }
    if (evento.status) {
      campos.push({ label: 'Status', valor: evento.status });
    }
    if (evento.valor !== undefined) {
      campos.push({ label: 'Valor', valor: `R$ ${evento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, destaque: true });
    }

    return [
      {
        titulo: 'Informações do evento',
        campos
      }
    ];
  }

  private formatarDataExibicao(dataIso: string): string {
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.erro = '';

    this.service.obterEventos().subscribe({
      next: eventos => {
        this.eventos = eventos;
        this.carregando = false;
        this.paginaAtualEventos = 1;
      },
      error: () => {
        this.erro = 'Não foi possível carregar a linha do tempo agora.';
        this.carregando = false;
      }
    });
  }

  setFiltroTipo(valor: string): void {
    this.filtroTipo = valor as FiltroTipo;
    this.paginaAtualEventos = 1;
  }

  onFiltroTextoChange(): void {
    this.paginaAtualEventos = 1;
  }

  limparFiltros(): void {
    this.filtroTipo = TODOS;
    this.busca = '';
    this.dataInicio = '';
    this.dataFim = '';
    this.paginaAtualEventos = 1;
  }

  tipoLabel(tipo: TimelineTipo): string {
    return TIMELINE_TIPO_LABEL[tipo];
  }

  tipoClasse(tipo: TimelineTipo): string {
    return 'evento-' + tipo.toLowerCase().replace(/_/g, '-');
  }

  get totalEventos(): number {
    return this.eventos.length;
  }

  get valorMovimentado(): number {
    return this.eventos.reduce((soma, evento) => soma + (evento.valor ?? 0), 0);
  }

  get ultimaCompra(): TimelineEvento | undefined {
    return this.eventos.find(evento => evento.tipo === 'COMPRA');
  }

  get ultimoPagamento(): TimelineEvento | undefined {
    return this.eventos.find(evento => evento.tipo === 'PAGAMENTO');
  }

  get eventosDesteMes(): number {
    const hoje = new Date();
    const prefixoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    return this.eventos.filter(evento => evento.data.startsWith(prefixoMes)).length;
  }

  get eventosFiltrados(): TimelineEvento[] {
    const termo = this.busca.trim().toLowerCase();

    return this.eventos.filter(evento => {
      if (this.filtroTipo !== TODOS && evento.tipo !== this.filtroTipo) {
        return false;
      }

      if (this.dataInicio && evento.data < this.dataInicio) {
        return false;
      }

      if (this.dataFim && evento.data > this.dataFim) {
        return false;
      }

      if (termo) {
        const alvo = [evento.titulo, evento.descricao, evento.fornecedor, evento.categoriaLabel]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!alvo.includes(termo)) {
          return false;
        }
      }

      return true;
    });
  }

  get totalPaginasEventos(): number {
    return Math.max(1, Math.ceil(this.eventosFiltrados.length / this.eventosPorPagina));
  }

  get eventosPaginados(): TimelineEvento[] {
    if (this.paginaAtualEventos > this.totalPaginasEventos) {
      this.paginaAtualEventos = this.totalPaginasEventos;
    }
    const inicio = (this.paginaAtualEventos - 1) * this.eventosPorPagina;
    return this.eventosFiltrados.slice(inicio, inicio + this.eventosPorPagina);
  }

  get paginasVisiveisEventos(): (number | string)[] {
    return this.calcularPaginasVisiveis(this.paginaAtualEventos, this.totalPaginasEventos);
  }

  irParaPaginaEventos(pagina: number | string): void {
    if (typeof pagina !== 'number' || pagina < 1 || pagina > this.totalPaginasEventos) { return; }
    this.paginaAtualEventos = pagina;
  }

  private calcularPaginasVisiveis(atual: number, total: number): (number | string)[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const paginas: (number | string)[] = [1];
    if (atual > 3) { paginas.push('...'); }
    const inicio = Math.max(2, atual - 1);
    const fim = Math.min(total - 1, atual + 1);
    for (let i = inicio; i <= fim; i++) { paginas.push(i); }
    if (atual < total - 2) { paginas.push('...'); }
    paginas.push(total);
    return paginas;
  }

  get grupos(): { mesLabel: string; eventos: TimelineEvento[] }[] {
    const mapa = new Map<string, TimelineEvento[]>();

    this.eventosPaginados.forEach(evento => {
      const chave = evento.data.slice(0, 7);
      const lista = mapa.get(chave) ?? [];
      lista.push(evento);
      mapa.set(chave, lista);
    });

    return Array.from(mapa.entries()).map(([chave, eventos]) => ({
      mesLabel: this.formatarMesAno(chave),
      eventos
    }));
  }

  private formatarMesAno(chave: string): string {
    const [ano, mes] = chave.split('-').map(Number);
    const data = new Date(ano, mes - 1, 1);
    const label = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}
