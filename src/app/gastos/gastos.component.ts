import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GastoService } from '../core/gasto.service';
import { Categoria, Gasto, ResumoGastos, StatusMaterial } from '../core/models';

export interface DropdownOpcao {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dropdown-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="dropdown" [class.aberto]="aberto">
      <button
        type="button"
        class="dropdown-trigger"
        [class.disabled]="disabled"
        [disabled]="disabled"
        [id]="id"
        [attr.aria-expanded]="aberto"
        (click)="toggle()">
        <span class="dropdown-valor" [class.placeholder]="!selecionado">{{ selecionado ? selecionado.label : placeholder }}</span>
        <svg class="dropdown-seta" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>

    <ul
      class="dropdown-lista"
      *ngIf="aberto"
      role="listbox"
      [style.top.px]="posicao.top"
      [style.left.px]="posicao.left"
      [style.width.px]="posicao.width"
      [style.max-height.px]="posicao.maxHeight">
      <li
        *ngFor="let opcao of options"
        role="option"
        [class.selecionado]="opcao.value === value"
        (click)="selecionar(opcao)">
        {{ opcao.label }}
      </li>
    </ul>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
    }

    .dropdown {
      position: relative;
    }

    .dropdown-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 9px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.82rem;
      font-family: inherit;
      font-weight: 400;
      background: #fafaf9;
      color: #111827;
      cursor: pointer;
      text-align: left;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }

    .dropdown-trigger:hover:not(.disabled) {
      background: #fff;
    }

    .dropdown-trigger.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .dropdown.aberto .dropdown-trigger,
    .dropdown-trigger:focus-visible {
      outline: none;
      border-color: #f59e0b;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.14);
    }

    .dropdown-valor {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-valor.placeholder {
      color: #9ca3af;
    }

    .dropdown-seta {
      flex-shrink: 0;
      margin-left: 8px;
      color: #9ca3af;
      transition: transform 0.15s ease;
    }

    .dropdown.aberto .dropdown-seta {
      transform: rotate(180deg);
      color: #f59e0b;
    }

    .dropdown-lista {
      position: fixed;
      margin: 0;
      padding: 4px;
      list-style: none;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 26px rgba(17, 24, 39, 0.14);
      z-index: 1000;
      max-height: 220px;
      overflow-y: auto;
    }

    .dropdown-lista li {
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 0.82rem;
      color: #111827;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s ease, color 0.12s ease;
    }

    .dropdown-lista li:hover {
      background: #fef3c7;
      color: #b45309;
    }

    .dropdown-lista li.selecionado {
      background: #f59e0b;
      color: #fff;
      font-weight: 700;
    }
  `]
})
export class DropdownSelectComponent implements ControlValueAccessor, OnDestroy {
  @Input() options: DropdownOpcao[] = [];
  @Input() placeholder = 'Selecione';
  @Input() id = '';

  value: string | null = null;
  aberto = false;
  disabled = false;
  posicao: { top: number; left: number; width: number; maxHeight: number } =
    { top: 0, left: 0, width: 0, maxHeight: 220 };

  // Registro global: cada dropdown aberto que precisou de espaço extra
  // entra aqui, junto com QUAL container ele expandiu (pode ser a página
  // inteira ou um painel interno com scroll próprio).
  private static expansaoAtiva: {
    container: HTMLElement | Window;
    paddingOriginal: string;
    owners: Set<DropdownSelectComponent>;
  } | null = null;

  private containerExpandido: HTMLElement | Window | null = null;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private onScrollOuAtualizarBind = () => this.atualizarPosicao();

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  get selecionado(): DropdownOpcao | undefined {
    return this.options.find(opcao => opcao.value === this.value);
  }

  toggle(): void {
    if (this.disabled) { return; }
    if (this.aberto) {
      this.fechar();
    } else {
      this.abrir();
    }
  }

  private abrir(): void {
    this.aberto = true;
    this.prepararAbertura();
    window.addEventListener('scroll', this.onScrollOuAtualizarBind, true);
    window.addEventListener('resize', this.onScrollOuAtualizarBind);
  }

  private fechar(): void {
    this.aberto = false;
    this.removerListeners();
    this.removerEspacoExtra();
    this.onTouched();
  }

  private prepararAbertura(): void {
    const alturaDesejada = 220;
    const margem = 6;
    const folga = 24; // margem de segurança extra
    const botao = this.elementRef.nativeElement.querySelector('.dropdown-trigger') as HTMLElement | null;
    if (!botao) { return; }

    const rect = botao.getBoundingClientRect();
    const espacoAbaixo = window.innerHeight - rect.bottom - margem;

    if (espacoAbaixo < alturaDesejada) {
      // Não cabe: descobre QUEM realmente rola (a página ou um painel
      // interno) e aumenta a altura dele de verdade, criando espaço real
      // para rolar — em vez de tentar rolar a window, que pode não ser
      // quem controla o scroll nesse layout.
      const deficit = Math.ceil(alturaDesejada - espacoAbaixo);
      const container = this.encontrarContainerRolavel(botao);
      this.aplicarEspacoExtra(container, deficit + folga);

      requestAnimationFrame(() => {
        const distancia = deficit + margem;
        if (container === window) {
          window.scrollBy({ top: distancia, behavior: 'auto' });
        } else {
          (container as HTMLElement).scrollTop += distancia;
        }
        this.atualizarPosicao();
      });
    } else {
      this.removerEspacoExtra();
      this.atualizarPosicao();
    }
  }

  // Sobe pela árvore de elementos a partir do botão até achar um ancestral
  // que realmente tem scroll próprio (overflow-y auto/scroll com conteúdo
  // maior que a área visível). Se não achar nenhum, assume que é a window.
  private encontrarContainerRolavel(elemento: HTMLElement): HTMLElement | Window {
    let node: HTMLElement | null = elemento.parentElement;

    while (node && node !== document.body && node !== document.documentElement) {
      const estilo = window.getComputedStyle(node);
      const overflowY = estilo.overflowY;
      const temOverflowRolavel = overflowY === 'auto' || overflowY === 'scroll';
      const conteudoMaiorQueArea = node.scrollHeight > node.clientHeight + 1;

      if (temOverflowRolavel && conteudoMaiorQueArea) {
        return node;
      }
      node = node.parentElement;
    }

    return window;
  }

  private atualizarPosicao(): void {
    const botao = this.elementRef.nativeElement.querySelector('.dropdown-trigger') as HTMLElement | null;
    if (!botao) { return; }

    const rect = botao.getBoundingClientRect();
    const margem = 6;
    const alturaMaximaPadrao = 220;
    const espacoAbaixo = Math.max(0, window.innerHeight - rect.bottom - margem);

    this.posicao = {
      top: rect.bottom + margem,
      left: rect.left,
      width: rect.width,
      maxHeight: espacoAbaixo > 0 ? Math.min(alturaMaximaPadrao, espacoAbaixo) : alturaMaximaPadrao
    };
  }

  // Aumenta a altura "de verdade" do container que rola (padding-bottom),
  // criando espaço real para o scroll ir até lá. Some sozinho ao fechar.
  private aplicarEspacoExtra(container: HTMLElement | Window, altura: number): void {
    const alvo: HTMLElement = container === window ? document.body : (container as HTMLElement);
    const expansaoAtual = DropdownSelectComponent.expansaoAtiva;

    if (!expansaoAtual || expansaoAtual.container !== container) {
      // Havia expansão em outro container (outro dropdown)? Desfaz ela antes.
      if (expansaoAtual) {
        const alvoAntigo: HTMLElement = expansaoAtual.container === window ? document.body : (expansaoAtual.container as HTMLElement);
        alvoAntigo.style.paddingBottom = expansaoAtual.paddingOriginal;
      }

      DropdownSelectComponent.expansaoAtiva = {
        container,
        paddingOriginal: alvo.style.paddingBottom || '',
        owners: new Set([this])
      };
    } else {
      expansaoAtual.owners.add(this);
    }

    alvo.style.paddingBottom = altura + 'px';
    this.containerExpandido = container;
  }

  private removerEspacoExtra(): void {
    const expansaoAtual = DropdownSelectComponent.expansaoAtiva;
    this.containerExpandido = null;
    if (!expansaoAtual) { return; }

    expansaoAtual.owners.delete(this);
    if (expansaoAtual.owners.size === 0) {
      const alvo: HTMLElement = expansaoAtual.container === window ? document.body : (expansaoAtual.container as HTMLElement);
      alvo.style.paddingBottom = expansaoAtual.paddingOriginal;
      DropdownSelectComponent.expansaoAtiva = null;
    }
  }

  private removerListeners(): void {
    window.removeEventListener('scroll', this.onScrollOuAtualizarBind, true);
    window.removeEventListener('resize', this.onScrollOuAtualizarBind);
  }

  selecionar(opcao: DropdownOpcao): void {
    this.value = opcao.value;
    this.onChange(this.value);
    this.fechar();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.aberto && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.fechar();
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.aberto) {
      this.fechar();
    }
  }

  ngOnDestroy(): void {
    this.removerListeners();
    this.removerEspacoExtra();
  }

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

const CATEGORIAS: Categoria[] = ['MATERIAL', 'MAO_DE_OBRA', 'TRANSPORTE', 'OUTROS'];

const CATEGORIA_LABEL: Record<Categoria, string> = {
  MATERIAL: 'Material',
  MAO_DE_OBRA: 'Mão de obra',
  TRANSPORTE: 'Transporte',
  OUTROS: 'Outros'
};

const CATEGORIA_CLASSE: Record<Categoria, string> = {
  MATERIAL: 'cat-material',
  MAO_DE_OBRA: 'cat-mao-de-obra',
  TRANSPORTE: 'cat-transporte',
  OUTROS: 'cat-outros'
};

const STATUS_MATERIAL_ORDEM: StatusMaterial[] = ['RETIRADO', 'A_CAMINHO', 'ENTREGUE'];

const STATUS_MATERIAL_LABEL: Record<StatusMaterial, string> = {
  RETIRADO: 'Retirado',
  A_CAMINHO: 'A caminho',
  ENTREGUE: 'Entregue'
};

const STATUS_MATERIAL_CLASSE: Record<StatusMaterial, string> = {
  RETIRADO: 'status-retirado',
  A_CAMINHO: 'status-caminho',
  ENTREGUE: 'status-entregue'
};

type FiltroStatus = 'todos' | 'pago' | 'pendente';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSelectComponent],
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.css'
})
export class GastosComponent implements OnInit {
  private service = inject(GastoService);

  categorias = CATEGORIAS;
  categoriaOptions: DropdownOpcao[] = CATEGORIAS.map(cat => ({ value: cat, label: CATEGORIA_LABEL[cat] }));
  statusMateriais = STATUS_MATERIAL_ORDEM;
  statusMaterialOptions: DropdownOpcao[] = STATUS_MATERIAL_ORDEM.map(status => ({ value: status, label: STATUS_MATERIAL_LABEL[status] }));
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

  categoriaClasse(categoria: Categoria): string {
    return CATEGORIA_CLASSE[categoria] ?? '';
  }

  statusMaterialLabel(status?: StatusMaterial): string {
    return status ? STATUS_MATERIAL_LABEL[status] : STATUS_MATERIAL_LABEL.RETIRADO;
  }

  statusMaterialClasse(status?: StatusMaterial): string {
    return status ? STATUS_MATERIAL_CLASSE[status] : STATUS_MATERIAL_CLASSE.RETIRADO;
  }

  avancarStatusMaterial(gasto: Gasto): void {
    if (!gasto.id || gasto.categoria !== 'MATERIAL') { return; }
    const atual = gasto.statusMaterial ?? 'RETIRADO';
    const proximoIndex = (STATUS_MATERIAL_ORDEM.indexOf(atual) + 1) % STATUS_MATERIAL_ORDEM.length;
    const proximo = STATUS_MATERIAL_ORDEM[proximoIndex];

    const atualizado: Gasto = {
      ...gasto,
      statusMaterial: proximo
    };

    this.service.atualizar(gasto.id, atualizado).subscribe(() => this.carregar());
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
    this.editForm = {
      ...gasto,
      diaVencimento: gasto.diaVencimento ?? 12,
      statusMaterial: gasto.statusMaterial ?? 'RETIRADO'
    };
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
      fornecedor: '',
      statusMaterial: 'RETIRADO',
      responsavelRecebimento: ''
    };
  }
}
