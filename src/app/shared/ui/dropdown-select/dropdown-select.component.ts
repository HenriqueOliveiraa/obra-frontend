import { Component, ElementRef, HostListener, Input, OnDestroy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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
    const folga = 24;
    const botao = this.elementRef.nativeElement.querySelector('.dropdown-trigger') as HTMLElement | null;
    if (!botao) { return; }

    const rect = botao.getBoundingClientRect();
    const espacoAbaixo = window.innerHeight - rect.bottom - margem;

    if (espacoAbaixo < alturaDesejada) {
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

  private aplicarEspacoExtra(container: HTMLElement | Window, altura: number): void {
    const alvo: HTMLElement = container === window ? document.body : (container as HTMLElement);
    const expansaoAtual = DropdownSelectComponent.expansaoAtiva;

    if (!expansaoAtual || expansaoAtual.container !== container) {
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
