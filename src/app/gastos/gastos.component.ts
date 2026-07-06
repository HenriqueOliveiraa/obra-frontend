import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastoService } from '../core/gasto.service';
import { Categoria, Gasto, ResumoGastos } from '../core/models';
import { CardComponent } from '../shared/ui/card/card.component';
import { PainelComponent } from '../shared/ui/painel/painel.component';
import { TagComponent, TagVariante } from '../shared/ui/tag/tag.component';
import { ModalComponent } from '../shared/ui/modal/modal.component';
import { IconeBotaoComponent } from '../shared/ui/icone-botao/icone-botao.component';
import { DropdownSelectComponent } from '../shared/ui/dropdown-select/dropdown-select.component';

export const CATEGORIAS: Categoria[] = ['MATERIAL', 'MAO_DE_OBRA', 'TRANSPORTE', 'OUTROS'];

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  MATERIAL: 'Material',
  MAO_DE_OBRA: 'Mão de obra',
  TRANSPORTE: 'Transporte',
  OUTROS: 'Outros'
};

export const CATEGORIA_CLASSE: Record<Categoria, TagVariante> = {
  MATERIAL: 'cat-material',
  MAO_DE_OBRA: 'cat-mao-de-obra',
  TRANSPORTE: 'cat-transporte',
  OUTROS: 'cat-outros'
};

type FiltroStatus = 'todos' | 'pago' | 'pendente';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, PainelComponent, TagComponent, ModalComponent, IconeBotaoComponent, DropdownSelectComponent],
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.css'
})
export class GastosComponent implements OnInit {
  private service = inject(GastoService);

  categorias = CATEGORIAS;
  gastos: Gasto[] = [];
  resumo: ResumoGastos = { totalGasto: 0, totalPago: 0, totalPendente: 0, parcelasPagas: 0, parcelasPendentes: 0 };

  filtroStatus: FiltroStatus = 'todos';

  mostrarForm = false;
  form: Gasto = this.formVazio();

  editandoId: number | null = null;
  editForm: Gasto = this.formVazio();

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.service.listar().subscribe(pagina => this.gastos = pagina.content);
    this.service.resumo().subscribe(resumo => this.resumo = resumo);
  }

  toggleForm(): void {
    this.mostrarForm = !this.mostrarForm;
    if (!this.mostrarForm) {
      this.form = this.formVazio();
    }
  }

  categoriaLabel(categoria: Categoria): string {
    return CATEGORIA_LABEL[categoria] ?? categoria;
  }

  categoriaClasse(categoria: Categoria): TagVariante {
    return CATEGORIA_CLASSE[categoria] ?? 'cat-outros';
  }

  gastoPago(gasto: Gasto): boolean {
    return !!gasto.parcelas?.every(p => p.pago);
  }

  get gastosFiltrados(): Gasto[] {
    if (this.filtroStatus === 'todos') { return this.gastos; }
    const querPago = this.filtroStatus === 'pago';
    return this.gastos.filter(g => this.gastoPago(g) === querPago);
  }

  setFiltro(filtro: FiltroStatus): void {
    this.filtroStatus = filtro;
  }

  salvar(): void {
    if (!this.form.parcelado) {
      this.form.numeroParcelas = 1;
    }

    this.service.criar(this.form).subscribe(() => {
      this.mostrarForm = false;
      this.form = this.formVazio();
      this.carregar();
    });
  }

  editar(gasto: Gasto): void {
    this.editandoId = gasto.id ?? null;
    this.editForm = { ...gasto, diaVencimento: gasto.diaVencimento ?? 12 };
  }

  salvarEdicao(): void {
    if (!this.editandoId) { return; }
    if (!this.editForm.parcelado) {
      this.editForm.numeroParcelas = 1;
    }

    this.service.atualizar(this.editandoId, this.editForm).subscribe(() => {
      this.fecharModal();
      this.carregar();
    });
  }

  fecharModal(): void {
    this.editandoId = null;
    this.editForm = this.formVazio();
  }

  pagar(gastoId: number | undefined, parcelaId: number): void {
    if (!gastoId) { return; }
    this.service.pagarParcela(gastoId, parcelaId).subscribe(() => this.carregar());
  }

  excluir(id: number | undefined): void {
    if (!id) { return; }
    this.service.excluir(id).subscribe(() => this.carregar());
  }

  private formVazio(): Gasto {
    return {
      descricao: '',
      categoria: 'MATERIAL',
      quantidade: 1,
      valorTotal: 0,
      parcelado: false,
      numeroParcelas: 1,
      diaVencimento: 12,
      dataCompra: new Date().toISOString().slice(0, 10),
      fornecedor: ''
    };
  }
}
