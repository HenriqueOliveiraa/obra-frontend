import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariante = 'neutro' | 'pago' | 'pendente';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  @Input() label = '';
  @Input() valor = '';
  @Input() sub?: string;
  @Input() variante: CardVariante = 'neutro';
  @Input() tamanho: 'normal' | 'grande' = 'normal';
  @Input() barraPercent?: number;
  @Input() barraCor?: string;
}
