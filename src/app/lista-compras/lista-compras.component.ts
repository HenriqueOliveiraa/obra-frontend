import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListaComprasService } from '../core/lista-compras.service';
import { Categoria, ItemCompra, PrioridadeCompra } from '../core/models';
import { CATEGORIAS, CATEGORIA_CLASSE, CATEGORIA_LABEL, DropdownOpcao, DropdownSelectComponent } from '../gastos/gastos.component';
import { CampoDetalhe, DetalheModalComponent, GrupoDetalhe } from '../shared/detalhe-modal/detalhe-modal.component';

const PRIORIDADES: PrioridadeCompra[] = ['ALTA', 'MEDIA', 'BAIXA'];

const PRIORIDADE_LABEL: Record<PrioridadeCompra, string> = {
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa'
};

const PRIORIDADE_CLASSE: Record<PrioridadeCompra, string> = {
  ALTA: 'prioridade-alta',
  MEDIA: 'prioridade-media',
  BAIXA: 'prioridade-baixa'
};

type FiltroStatus = 'todos' | 'pendentes' | 'comprados';

const FILTRO_STATUS_LABEL: Record<FiltroStatus, string> = {
  todos: 'Todos',
  pendentes: 'Pendentes',
  comprados: 'Comprados'
};

const FILTRO_STATUS_ORDEM: FiltroStatus[] = ['todos', 'pendentes', 'comprados'];

@Component({
  selector: 'app-lista-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSelectComponent, DetalheModalComponent],
  templateUrl: './lista-compras.component.html',
  styleUrl: './lista-compras.component.css'
})
export class ListaComprasComponent implements OnInit {
  private service = inject(ListaComprasService);

  categorias = CATEGORIAS;
  categoriaOptions: DropdownOpcao[] = CATEGORIAS.map(cat => ({ value: cat, label: CATEGORIA_LABEL[cat] }));

  prioridades = PRIORIDADES;
  prioridadeOptions: DropdownOpcao[] = PRIORIDADES.map(p => ({ value: p, label: PRIORIDADE_LABEL[p] }));
  filtroStatusOptions: DropdownOpcao[] = FILTRO_STATUS_ORDEM.map(status => ({ value: status, label: FILTRO_STATUS_LABEL[status] }));

  itens: ItemCompra[] = [];
  filtroStatus: FiltroStatus = 'todos';

  itensPorPagina = 10;
  paginaAtualItens = 1;

  mostrarForm = false;
  form: ItemCompra = this.formVazio();

  editandoId: number | null = null;
  editForm: ItemCompra = this.formVazio();

  // --- Detalhes (modal reutilizável) ---

  detalhesId: number | null = null;

  abrirDetalhes(item: ItemCompra): void {
    this.detalhesId = item.id ?? null;
  }

  fecharDetalhes(): void {
    this.detalhesId = null;
  }

  get itemDetalhes(): ItemCompra | undefined {
    return this.itens.find(item => item.id === this.detalhesId);
  }

  get gruposDetalhesItem(): GrupoDetalhe[] {
    const item = this.itemDetalhes;
    if (!item) { return []; }

    const campos: CampoDetalhe[] = [
      { label: 'Categoria', valor: this.categoriaLabel(item.categoria), tag: true, classeTag: this.categoriaClasse(item.categoria) },
      { label: 'Quantidade desejada', valor: item.quantidadeDesejada !== undefined && item.quantidadeDesejada !== null ? String(item.quantidadeDesejada) : '—' },
      { label: 'Prioridade', valor: this.prioridadeLabel(item.prioridade), tag: true, classeTag: this.prioridadeClasse(item.prioridade) },
      { label: 'Observação', valor: item.observacao || '—' },
      { label: 'Status', valor: item.comprado ? 'Comprado' : 'Pendente', tag: true, classeTag: item.comprado ? 'pago' : 'pendente' }
    ];

    return [
      {
        titulo: 'Informações do item',
        campos
      }
    ];
  }

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.service.listar().subscribe(itens => {
      this.itens = itens;
      if (this.paginaAtualItens > this.totalPaginasItens) {
        this.paginaAtualItens = this.totalPaginasItens;
      }
    });
  }

  categoriaLabel(categoria: Categoria): string {
    return CATEGORIA_LABEL[categoria] ?? categoria;
  }

  categoriaClasse(categoria: Categoria): string {
    return CATEGORIA_CLASSE[categoria] ?? '';
  }

  prioridadeLabel(prioridade: PrioridadeCompra): string {
    return PRIORIDADE_LABEL[prioridade] ?? prioridade;
  }

  prioridadeClasse(prioridade: PrioridadeCompra): string {
    return PRIORIDADE_CLASSE[prioridade] ?? '';
  }

  get pendentes(): ItemCompra[] {
    return this.itens.filter(item => !item.comprado);
  }

  get comprados(): ItemCompra[] {
    return this.itens.filter(item => item.comprado);
  }

  get pendentesPrioridadeAlta(): ItemCompra[] {
    return this.pendentes.filter(item => item.prioridade === 'ALTA');
  }

  get itensFiltrados(): ItemCompra[] {
    if (this.filtroStatus === 'pendentes') { return this.pendentes; }
    if (this.filtroStatus === 'comprados') { return this.comprados; }
    return this.itens;
  }

  get totalPaginasItens(): number {
    return Math.max(1, Math.ceil(this.itensFiltrados.length / this.itensPorPagina));
  }

  get itensPaginados(): ItemCompra[] {
    const inicio = (this.paginaAtualItens - 1) * this.itensPorPagina;
    return this.itensFiltrados.slice(inicio, inicio + this.itensPorPagina);
  }

  get paginasVisiveisItens(): (number | string)[] {
    return this.calcularPaginasVisiveis(this.paginaAtualItens, this.totalPaginasItens);
  }

  irParaPaginaItens(pagina: number | string): void {
    if (typeof pagina !== 'number' || pagina < 1 || pagina > this.totalPaginasItens) { return; }
    this.paginaAtualItens = pagina;
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

  setFiltro(filtro: string): void {
    this.filtroStatus = filtro as FiltroStatus;
    this.paginaAtualItens = 1;
  }

  toggleForm(): void {
    this.mostrarForm = !this.mostrarForm;
    if (!this.mostrarForm) {
      this.form = this.formVazio();
    }
  }

  salvar(): void {
    this.service.criar(this.form).subscribe(() => {
      this.mostrarForm = false;
      this.form = this.formVazio();
      this.carregar();
    });
  }

  editar(item: ItemCompra): void {
    this.editandoId = item.id ?? null;
    this.editForm = { ...item };
  }

  salvarEdicao(): void {
    if (!this.editandoId) { return; }
    this.service.atualizar(this.editandoId, this.editForm).subscribe(() => {
      this.fecharModal();
      this.carregar();
    });
  }

  fecharModal(): void {
    this.editandoId = null;
    this.editForm = this.formVazio();
  }

  alternarComprado(item: ItemCompra): void {
    if (!item.id) { return; }
    const atualizado: ItemCompra = { ...item, comprado: !item.comprado };
    this.service.atualizar(item.id, atualizado).subscribe(() => this.carregar());
  }

  excluir(id: number | undefined): void {
    if (!id) { return; }
    this.service.excluir(id).subscribe(() => this.carregar());
  }

  private formVazio(): ItemCompra {
    return {
      descricao: '',
      categoria: 'MATERIAL',
      quantidadeDesejada: undefined,
      prioridade: 'MEDIA',
      observacao: '',
      comprado: false
    };
  }
}
