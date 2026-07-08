import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CampoDetalhe {
  label: string;
  valor: string;
  tag?: boolean;
  classeTag?: string;
  destaque?: boolean;
  corValor?: string;
  /** Exibe o valor como um "chip" de arquivo, com ícone de documento. */
  arquivo?: boolean;
}

export interface GrupoDetalhe {
  titulo?: string;
  campos: CampoDetalhe[];
  /** Usa um espaçamento mais compacto — ideal para listas repetitivas, como parcelas. */
  compacto?: boolean;
}

@Component({
  selector: 'app-detalhe-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalhe-modal.component.html',
  styleUrl: './detalhe-modal.component.css'
})
export class DetalheModalComponent {
  @Input() aberto = false;
  @Input() titulo = 'Detalhes';
  @Input() subtitulo = '';
  @Input() grupos: GrupoDetalhe[] = [];

  @Output() fechar = new EventEmitter<void>();

  fecharModal(): void {
    this.fechar.emit();
  }
}
