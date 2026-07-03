import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastoService } from '../core/gasto.service';
import { FornecedorService } from '../core/fornecedor.service';
import { ComprovanteService } from '../core/comprovante.service';
import { ListaComprasService } from '../core/lista-compras.service';
import { EtapaGastoService, ClassificacaoGasto } from '../core/etapa-gasto.service';
import { Categoria, CategoriaOrcamento, Comprovante, Fornecedor, Gasto, ItemCompra, PrioridadeCompra } from '../core/models';
import { DropdownOpcao, DropdownSelectComponent } from '../gastos/gastos.component';
import {
  CATEGORIAS_ORCAMENTO,
  CATEGORIA_ORCAMENTO_LABEL,
  CATEGORIA_ORCAMENTO_CLASSE,
  SUBCATEGORIAS_POR_CATEGORIA,
  SUBCATEGORIA_OUTRO
} from '../core/categorias-orcamento';

type Aba = 'etapas' | 'fornecedores' | 'comprovantes' | 'lista-compras';

const SEM_CATEGORIA = '';
const TODAS_CATEGORIAS = 'TODAS';
const SEM_CATEGORIA_FILTRO = 'SEM_CATEGORIA';

const CATEGORIAS_COMPRA: Categoria[] = ['MATERIAL', 'MAO_DE_OBRA', 'TRANSPORTE', 'OUTROS'];

const CATEGORIA_COMPRA_LABEL: Record<Categoria, string> = {
  MATERIAL: 'Material',
  MAO_DE_OBRA: 'Mão de obra',
  TRANSPORTE: 'Transporte',
  OUTROS: 'Outros'
};

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

type FiltroComprados = 'PENDENTES' | 'COMPRADOS' | 'TODOS';

interface ResumoCategoria {
  categoria: CategoriaOrcamento;
  label: string;
  classe: string;
  total: number;
}

@Component({
  selector: 'app-materiais',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSelectComponent],
  templateUrl: './materiais.component.html',
  styleUrl: './materiais.component.css'
})
export class MateriaisComponent implements OnInit {
  private gastoService = inject(GastoService);
  private fornecedorService = inject(FornecedorService);
  private comprovanteService = inject(ComprovanteService);
  private listaComprasService = inject(ListaComprasService);
  private etapaGastoService = inject(EtapaGastoService);

  abaAtiva: Aba = 'etapas';

  gastos: Gasto[] = [];
  classificacoesPorGasto: Record<number, ClassificacaoGasto> = {};

  categoriaOptions: DropdownOpcao[] = CATEGORIAS_ORCAMENTO.map(cat => ({ value: cat, label: CATEGORIA_ORCAMENTO_LABEL[cat] }));
  categoriaOptionsComVazio: DropdownOpcao[] = [
    { value: SEM_CATEGORIA, label: 'Sem categoria definida' },
    ...this.categoriaOptions
  ];

  filtroCategoriaOptions: DropdownOpcao[] = [
    { value: TODAS_CATEGORIAS, label: 'Todas as categorias' },
    ...this.categoriaOptions,
    { value: SEM_CATEGORIA_FILTRO, label: 'Sem categoria definida' }
  ];

  filtroCategoria = TODAS_CATEGORIAS;

  fornecedores: Fornecedor[] = [];
  mostrarFormFornecedor = false;
  formFornecedor: Fornecedor = this.fornecedorVazio();
  editandoFornecedorId: number | null = null;

  comprovantes: Comprovante[] = [];
  visualizandoComprovante: Comprovante | null = null;

  itensCompra: ItemCompra[] = [];
  categoriasCompra = CATEGORIAS_COMPRA;
  categoriaCompraOptions: DropdownOpcao[] = CATEGORIAS_COMPRA.map(cat => ({ value: cat, label: CATEGORIA_COMPRA_LABEL[cat] }));
  prioridadeOptions: DropdownOpcao[] = PRIORIDADES.map(p => ({ value: p, label: PRIORIDADE_LABEL[p] }));
  mostrarFormCompra = false;
  formCompra: ItemCompra = this.itemCompraVazio();
  editandoCompraId: number | null = null;
  filtroComprados: FiltroComprados = 'PENDENTES';

  ngOnInit(): void {
    this.carregarGastos();
    this.carregarFornecedores();
    this.carregarComprovantes();
    this.carregarListaCompras();
    this.carregarClassificacoes();
  }

  setAba(aba: Aba): void {
    this.abaAtiva = aba;
  }

  // ── Etapas / Categorias (guardadas em localStorage via EtapaGastoService, enquanto o back não tem o campo) ──

  carregarGastos(): void {
    this.gastoService.listar().subscribe(pagina => this.gastos = pagina.content);
  }

  carregarClassificacoes(): void {
    this.etapaGastoService.listar().subscribe(mapa => this.classificacoesPorGasto = mapa);
  }

  classificacaoDoGasto(gasto: Gasto): ClassificacaoGasto | undefined {
    if (!gasto.id) { return undefined; }
    return this.classificacoesPorGasto[gasto.id];
  }

  categoriaDoGasto(gasto: Gasto): CategoriaOrcamento | undefined {
    return this.classificacaoDoGasto(gasto)?.categoria;
  }

  categoriaLabel(categoria?: CategoriaOrcamento): string {
    return categoria ? (CATEGORIA_ORCAMENTO_LABEL[categoria] ?? categoria) : 'Sem categoria definida';
  }

  categoriaClasse(categoria?: CategoriaOrcamento): string {
    return categoria ? (CATEGORIA_ORCAMENTO_CLASSE[categoria] ?? '') : 'categoria-indefinida';
  }

  subcategoriaOptions(categoria: CategoriaOrcamento): DropdownOpcao[] {
    const opcoes = SUBCATEGORIAS_POR_CATEGORIA[categoria].map(sub => ({ value: sub, label: sub }));
    return [...opcoes, { value: SUBCATEGORIA_OUTRO, label: 'Outro (especificar)' }];
  }

  subcategoriaSelectValue(gasto: Gasto): string {
    const classif = this.classificacaoDoGasto(gasto);
    if (!classif) { return ''; }
    const opcoesPadrao = SUBCATEGORIAS_POR_CATEGORIA[classif.categoria];
    return opcoesPadrao.includes(classif.subcategoria) ? classif.subcategoria : SUBCATEGORIA_OUTRO;
  }

  customSubcategoriaValue(gasto: Gasto): string {
    const classif = this.classificacaoDoGasto(gasto);
    if (!classif) { return ''; }
    const opcoesPadrao = SUBCATEGORIAS_POR_CATEGORIA[classif.categoria];
    return opcoesPadrao.includes(classif.subcategoria) ? '' : classif.subcategoria;
  }

  totalPorCategoria(categoria: CategoriaOrcamento): number {
    return this.gastos
      .filter(g => this.categoriaDoGasto(g) === categoria)
      .reduce((soma, g) => soma + g.valorTotal, 0);
  }

  get categoriasComGasto(): ResumoCategoria[] {
    return CATEGORIAS_ORCAMENTO
      .map(categoria => ({
        categoria,
        label: this.categoriaLabel(categoria),
        classe: this.categoriaClasse(categoria),
        total: this.totalPorCategoria(categoria)
      }))
      .filter(resumo => resumo.total > 0);
  }

  get gastosSemCategoria(): Gasto[] {
    return this.gastos.filter(g => !this.categoriaDoGasto(g));
  }

  get totalSemCategoria(): number {
    return this.gastosSemCategoria.reduce((soma, g) => soma + g.valorTotal, 0);
  }

  setFiltroCategoria(valor: string): void {
    this.filtroCategoria = valor;
  }

  get gastosFiltradosPorCategoria(): Gasto[] {
    if (this.filtroCategoria === TODAS_CATEGORIAS) { return this.gastos; }
    if (this.filtroCategoria === SEM_CATEGORIA_FILTRO) { return this.gastosSemCategoria; }
    return this.gastos.filter(g => this.categoriaDoGasto(g) === this.filtroCategoria);
  }

  onCategoriaChange(gasto: Gasto, valor: string): void {
    if (!gasto.id) { return; }

    if (valor === SEM_CATEGORIA) {
      this.etapaGastoService.definir(gasto.id, undefined).subscribe(() => this.carregarClassificacoes());
      return;
    }

    const categoria = valor as CategoriaOrcamento;
    const subcategoria = SUBCATEGORIAS_POR_CATEGORIA[categoria][0];
    this.etapaGastoService.definir(gasto.id, { categoria, subcategoria }).subscribe(() => this.carregarClassificacoes());
  }

  onSubcategoriaChange(gasto: Gasto, valor: string): void {
    if (!gasto.id) { return; }
    const categoria = this.categoriaDoGasto(gasto);
    if (!categoria) { return; }

    const subcategoria = valor === SUBCATEGORIA_OUTRO ? '' : valor;
    this.etapaGastoService.definir(gasto.id, { categoria, subcategoria }).subscribe(() => this.carregarClassificacoes());
  }

  onSubcategoriaCustomChange(gasto: Gasto, event: Event): void {
    if (!gasto.id) { return; }
    const categoria = this.categoriaDoGasto(gasto);
    if (!categoria) { return; }

    const input = event.target as HTMLInputElement;
    const subcategoria = input.value.trim();
    this.etapaGastoService.definir(gasto.id, { categoria, subcategoria }).subscribe(() => this.carregarClassificacoes());
  }

  // ── Fornecedores ──

  carregarFornecedores(): void {
    this.fornecedorService.listar().subscribe(fornecedores => this.fornecedores = fornecedores);
  }

  toggleFormFornecedor(): void {
    this.mostrarFormFornecedor = !this.mostrarFormFornecedor;
    if (!this.mostrarFormFornecedor) {
      this.formFornecedor = this.fornecedorVazio();
      this.editandoFornecedorId = null;
    }
  }

  salvarFornecedor(): void {
    if (this.editandoFornecedorId) {
      this.fornecedorService.atualizar(this.editandoFornecedorId, this.formFornecedor).subscribe(() => this.finalizarFormFornecedor());
      return;
    }
    this.fornecedorService.criar(this.formFornecedor).subscribe(() => this.finalizarFormFornecedor());
  }

  editarFornecedor(fornecedor: Fornecedor): void {
    this.editandoFornecedorId = fornecedor.id ?? null;
    this.formFornecedor = { ...fornecedor };
    this.mostrarFormFornecedor = true;
  }

  excluirFornecedor(id: number | undefined): void {
    if (!id) { return; }
    this.fornecedorService.excluir(id).subscribe(() => this.carregarFornecedores());
  }

  historicoDoFornecedor(fornecedor: Fornecedor): Gasto[] {
    const nome = fornecedor.nome.trim().toLowerCase();
    if (!nome) { return []; }
    return this.gastos.filter(g => (g.fornecedor ?? '').trim().toLowerCase() === nome);
  }

  totalComFornecedor(fornecedor: Fornecedor): number {
    return this.historicoDoFornecedor(fornecedor).reduce((soma, g) => soma + g.valorTotal, 0);
  }

  private finalizarFormFornecedor(): void {
    this.mostrarFormFornecedor = false;
    this.editandoFornecedorId = null;
    this.formFornecedor = this.fornecedorVazio();
    this.carregarFornecedores();
  }

  private fornecedorVazio(): Fornecedor {
    return { nome: '', telefone: '', especialidade: '', observacao: '' };
  }

  // ── Comprovantes ──

  carregarComprovantes(): void {
    this.comprovanteService.listar().subscribe(comprovantes => this.comprovantes = comprovantes);
  }

  comprovanteDoGasto(gastoId: number | undefined): Comprovante | undefined {
    if (!gastoId) { return undefined; }
    return this.comprovantes.find(c => c.gastoId === gastoId);
  }

  ehImagem(comprovante: Comprovante): boolean {
    return comprovante.tipoArquivo.startsWith('image/');
  }

  onArquivoSelecionado(gastoId: number | undefined, event: Event): void {
    if (!gastoId) { return; }
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) { return; }

    const leitor = new FileReader();
    leitor.onload = () => {
      const comprovante: Comprovante = {
        gastoId,
        nomeArquivo: arquivo.name,
        tipoArquivo: arquivo.type,
        dataUrl: leitor.result as string,
        dataUpload: new Date().toISOString()
      };
      this.comprovanteService.salvar(comprovante).subscribe(() => this.carregarComprovantes());
    };
    leitor.readAsDataURL(arquivo);
    input.value = '';
  }

  verComprovante(comprovante: Comprovante): void {
    this.visualizandoComprovante = comprovante;
  }

  fecharComprovante(): void {
    this.visualizandoComprovante = null;
  }

  removerComprovante(gastoId: number | undefined): void {
    if (!gastoId) { return; }
    this.comprovanteService.remover(gastoId).subscribe(() => this.carregarComprovantes());
  }

  // ── Lista de compras ──

  carregarListaCompras(): void {
    this.listaComprasService.listar().subscribe(itens => this.itensCompra = itens);
  }

  toggleFormCompra(): void {
    this.mostrarFormCompra = !this.mostrarFormCompra;
    if (!this.mostrarFormCompra) {
      this.formCompra = this.itemCompraVazio();
      this.editandoCompraId = null;
    }
  }

  salvarCompra(): void {
    if (this.editandoCompraId) {
      this.listaComprasService.atualizar(this.editandoCompraId, this.formCompra).subscribe(() => this.finalizarFormCompra());
      return;
    }
    this.listaComprasService.criar(this.formCompra).subscribe(() => this.finalizarFormCompra());
  }

  editarCompra(item: ItemCompra): void {
    this.editandoCompraId = item.id ?? null;
    this.formCompra = { ...item };
    this.mostrarFormCompra = true;
  }

  excluirCompra(id: number | undefined): void {
    if (!id) { return; }
    this.listaComprasService.excluir(id).subscribe(() => this.carregarListaCompras());
  }

  marcarComprado(item: ItemCompra): void {
    if (!item.id) { return; }
    const atualizado: ItemCompra = { ...item, comprado: !item.comprado };
    this.listaComprasService.atualizar(item.id, atualizado).subscribe(() => this.carregarListaCompras());
  }

  categoriaCompraLabel(categoria: Categoria): string {
    return CATEGORIA_COMPRA_LABEL[categoria] ?? categoria;
  }

  prioridadeLabel(prioridade: PrioridadeCompra): string {
    return PRIORIDADE_LABEL[prioridade] ?? prioridade;
  }

  prioridadeClasse(prioridade: PrioridadeCompra): string {
    return PRIORIDADE_CLASSE[prioridade] ?? '';
  }

  setFiltroComprados(filtro: FiltroComprados): void {
    this.filtroComprados = filtro;
  }

  get itensPendentes(): ItemCompra[] {
    return this.itensCompra.filter(i => !i.comprado);
  }

  get itensPendentesAltaPrioridade(): number {
    return this.itensPendentes.filter(i => i.prioridade === 'ALTA').length;
  }

  get itensCompradosCount(): number {
    return this.itensCompra.filter(i => i.comprado).length;
  }

  get itensFiltrados(): ItemCompra[] {
    const ordemPrioridade: Record<PrioridadeCompra, number> = { ALTA: 0, MEDIA: 1, BAIXA: 2 };

    const base = this.itensCompra.filter(item => {
      if (this.filtroComprados === 'PENDENTES') { return !item.comprado; }
      if (this.filtroComprados === 'COMPRADOS') { return item.comprado; }
      return true;
    });

    return [...base].sort((a, b) => ordemPrioridade[a.prioridade] - ordemPrioridade[b.prioridade]);
  }

  private finalizarFormCompra(): void {
    this.mostrarFormCompra = false;
    this.editandoCompraId = null;
    this.formCompra = this.itemCompraVazio();
    this.carregarListaCompras();
  }

  private itemCompraVazio(): ItemCompra {
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
