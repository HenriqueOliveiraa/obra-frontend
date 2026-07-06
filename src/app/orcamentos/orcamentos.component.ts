import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CotacaoService } from '../core/cotacao.service';
import { Cotacao, CategoriaOrcamento } from '../core/models';
import { DropdownOpcao, DropdownSelectComponent } from '../shared/ui/dropdown-select/dropdown-select.component';
import { PdfRelatorioService, formatarMoedaPdf, formatarDataPdf } from '../core/pdf/pdf-relatorio.service';
import {
  CATEGORIAS_ORCAMENTO,
  CATEGORIA_ORCAMENTO_LABEL,
  CATEGORIA_ORCAMENTO_CLASSE,
  SUBCATEGORIAS_POR_CATEGORIA,
  SUBCATEGORIA_OUTRO as OUTRO
} from '../core/categorias-orcamento';

const TODAS = 'TODAS';

type FiltroCategoria = 'TODAS' | CategoriaOrcamento;

interface GrupoSubcategoria {
  subcategoria: string;
  cotacoes: Cotacao[];
  menorValor: number;
}

interface GrupoCategoria {
  categoria: CategoriaOrcamento;
  label: string;
  classe: string;
  subgrupos: GrupoSubcategoria[];
}

@Component({
  selector: 'app-orcamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSelectComponent],
  templateUrl: './orcamentos.component.html',
  styleUrl: './orcamentos.component.css'
})
export class OrcamentosComponent implements OnInit {
  private service = inject(CotacaoService);
  private pdfService = inject(PdfRelatorioService);

  categorias = CATEGORIAS_ORCAMENTO;
  categoriaOptions: DropdownOpcao[] = CATEGORIAS_ORCAMENTO.map(cat => ({ value: cat, label: CATEGORIA_ORCAMENTO_LABEL[cat] }));
  filtroCategoriaOptions: DropdownOpcao[] = [{ value: TODAS, label: 'Todas as categorias' }, ...this.categoriaOptions];

  cotacoes: Cotacao[] = [];

  filtroCategoria: FiltroCategoria = TODAS;

  categoriasColapsadas = new Set<CategoriaOrcamento>();

  mostrarForm = false;
  form: Cotacao = this.formVazio();

  editandoId: number | null = null;
  editForm: Cotacao = this.formVazio();

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.service.listar().subscribe(cotacoes => this.cotacoes = cotacoes);
  }

  subcategoriaOptions(categoria: CategoriaOrcamento): DropdownOpcao[] {
    const opcoes = SUBCATEGORIAS_POR_CATEGORIA[categoria].map(sub => ({ value: sub, label: sub }));
    return [...opcoes, { value: OUTRO, label: 'Outro (especificar)' }];
  }

  categoriaLabel(categoria: CategoriaOrcamento): string {
    return CATEGORIA_ORCAMENTO_LABEL[categoria] ?? categoria;
  }

  categoriaClasse(categoria: CategoriaOrcamento): string {
    return CATEGORIA_ORCAMENTO_CLASSE[categoria] ?? '';
  }

  get ehSubcategoriaOutro(): boolean {
    return this.form.subcategoria === OUTRO;
  }

  get ehSubcategoriaOutroEdit(): boolean {
    return this.editForm.subcategoria === OUTRO;
  }

  onCategoriaChangeForm(valor: string): void {
    const categoria = valor as CategoriaOrcamento;
    this.form.categoria = categoria;
    this.form.subcategoria = SUBCATEGORIAS_POR_CATEGORIA[categoria][0];
    this.form.subcategoriaCustom = '';
  }

  onCategoriaChangeEdit(valor: string): void {
    const categoria = valor as CategoriaOrcamento;
    this.editForm.categoria = categoria;
    this.editForm.subcategoria = SUBCATEGORIAS_POR_CATEGORIA[categoria][0];
    this.editForm.subcategoriaCustom = '';
  }

  setFiltro(valor: string): void {
    this.filtroCategoria = valor as FiltroCategoria;
  }

  toggleCategoria(categoria: CategoriaOrcamento): void {
    if (this.categoriasColapsadas.has(categoria)) {
      this.categoriasColapsadas.delete(categoria);
    } else {
      this.categoriasColapsadas.add(categoria);
    }
  }

  estaColapsada(categoria: CategoriaOrcamento): boolean {
    return this.categoriasColapsadas.has(categoria);
  }

  get totalCotacoes(): number {
    return this.cotacoes.length;
  }

  get valorTotalEscolhido(): number {
    return this.cotacoes.filter(c => c.escolhido).reduce((soma, c) => soma + c.valor, 0);
  }

  get fornecedoresUnicos(): number {
    return new Set(this.cotacoes.map(c => c.fornecedor).filter(Boolean)).size;
  }

  get categoriasComCotacao(): number {
    return new Set(this.cotacoes.map(c => c.categoria)).size;
  }

  get gruposFiltrados(): GrupoCategoria[] {
    const categoriasAlvo = this.filtroCategoria === TODAS
      ? CATEGORIAS_ORCAMENTO
      : [this.filtroCategoria];

    return categoriasAlvo
      .map(categoria => {
        const cotacoesCategoria = this.cotacoes.filter(c => c.categoria === categoria);
        if (cotacoesCategoria.length === 0) { return null; }

        const subcategoriasUsadas = Array.from(new Set(cotacoesCategoria.map(c => c.subcategoria)));

        const subgrupos: GrupoSubcategoria[] = subcategoriasUsadas.map(subcategoria => {
          const cotacoesSub = cotacoesCategoria
            .filter(c => c.subcategoria === subcategoria)
            .sort((a, b) => a.valor - b.valor);

          return {
            subcategoria,
            cotacoes: cotacoesSub,
            menorValor: Math.min(...cotacoesSub.map(c => c.valor))
          };
        });

        return {
          categoria,
          label: this.categoriaLabel(categoria),
          classe: this.categoriaClasse(categoria),
          subgrupos
        };
      })
      .filter((grupo): grupo is GrupoCategoria => grupo !== null);
  }

  toggleForm(): void {
    this.mostrarForm = !this.mostrarForm;
    if (!this.mostrarForm) {
      this.form = this.formVazio();
    }
  }

  exportarPdf(): void {
    this.pdfService.carregarLogo().then(logo => {
      const pdf = this.pdfService.iniciar('Relatório de Orçamentos', logo);

      pdf.resumoCards([
        { label: 'Cotações registradas', valor: String(this.totalCotacoes) },
        { label: 'Valor total escolhido', valor: formatarMoedaPdf(this.valorTotalEscolhido), corValor: '#16a34a' },
        { label: 'Fornecedores cadastrados', valor: String(this.fornecedoresUnicos) },
        { label: 'Categorias com cotação', valor: `${this.categoriasComCotacao} / ${this.categorias.length}` }
      ]);

      const gruposVisiveis = this.gruposFiltrados.filter(grupo => !this.estaColapsada(grupo.categoria));
      const existemCategoriasOcultas = gruposVisiveis.length < this.gruposFiltrados.length;

      if (existemCategoriasOcultas) {
        pdf.textoDestaque('Categorias recolhidas na tela não foram incluídas neste relatório.');
      }

      if (gruposVisiveis.length === 0) {
        pdf.textoDestaque('Nenhuma categoria expandida para exportar. Expanda ao menos uma categoria na tela e exporte novamente.');
      }

      gruposVisiveis.forEach(grupo => {
        pdf.tituloSecao(grupo.label);

        grupo.subgrupos.forEach(sub => {
          pdf.subtitulo(sub.subcategoria);

          const linhas = sub.cotacoes.map(cotacao => ({
            fornecedor: cotacao.fornecedor,
            item: cotacao.item,
            valor: cotacao.valor,
            data: formatarDataPdf(cotacao.data),
            observacao: cotacao.observacao || '—',
            status: cotacao.escolhido
              ? 'Escolhida'
              : (cotacao.valor === sub.menorValor ? 'Mais barata' : '—')
          }));

          pdf.tabela({
            colunas: [
              { chave: 'fornecedor', titulo: 'Fornecedor', largura: 32 },
              { chave: 'item', titulo: 'Item', largura: 28 },
              { chave: 'valor', titulo: 'Valor', largura: 22, monetario: true },
              { chave: 'data', titulo: 'Data', largura: 20 },
              { chave: 'observacao', titulo: 'Observação', largura: 34 },
              { chave: 'status', titulo: 'Status', largura: 26 }
            ],
            linhas,
            destacarLinha: linha => {
              if (linha['status'] === 'Escolhida') { return { cor: '#d1fae5', corTexto: '#047857' }; }
              if (linha['status'] === 'Mais barata') { return { cor: '#fef3c7', corTexto: '#b45309' }; }
              return null;
            }
          });
        });
      });

      const dataArquivo = new Date().toISOString().slice(0, 10);
      pdf.salvar(`relatorio-orcamentos-${dataArquivo}.pdf`);
    });
  }

  salvar(): void {
    const cotacao = this.prepararParaSalvar(this.form);
    this.service.criar(cotacao).subscribe(() => {
      this.mostrarForm = false;
      this.form = this.formVazio();
      this.carregar();
    });
  }

  editar(cotacao: Cotacao): void {
    this.editandoId = cotacao.id ?? null;
    this.editForm = { ...cotacao };
  }

  salvarEdicao(): void {
    if (!this.editandoId) { return; }
    const cotacao = this.prepararParaSalvar(this.editForm);
    this.service.atualizar(this.editandoId, cotacao).subscribe(() => {
      this.fecharModal();
      this.carregar();
    });
  }

  fecharModal(): void {
    this.editandoId = null;
    this.editForm = this.formVazio();
  }

  marcarEscolhido(id: number | undefined): void {
    if (!id) { return; }
    this.service.marcarEscolhido(id).subscribe(() => this.carregar());
  }

  excluir(id: number | undefined): void {
    if (!id) { return; }
    this.service.excluir(id).subscribe(() => this.carregar());
  }

  private prepararParaSalvar(origem: Cotacao): Cotacao {
    const subcategoriaFinal = origem.subcategoria === OUTRO
      ? (origem.subcategoriaCustom ?? '').trim()
      : origem.subcategoria;

    return {
      ...origem,
      subcategoria: subcategoriaFinal
    };
  }

  private formVazio(): Cotacao {
    return {
      categoria: 'ALVENARIA',
      subcategoria: SUBCATEGORIAS_POR_CATEGORIA['ALVENARIA'][0],
      subcategoriaCustom: '',
      item: '',
      fornecedor: '',
      valor: 0,
      quantidade: undefined,
      unidade: '',
      data: new Date().toISOString().slice(0, 10),
      observacao: '',
      escolhido: false
    };
  }
}
