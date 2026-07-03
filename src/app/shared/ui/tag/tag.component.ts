import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TagVariante = 'pago' | 'pendente' | 'cat-material' | 'cat-mao-de-obra' | 'cat-transporte' | 'cat-outros';

@Component({
  selector: 'app-tag',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.css'
})
export class TagComponent {
  @Input() texto = '';
  @Input() variante: TagVariante = 'pendente';
}
