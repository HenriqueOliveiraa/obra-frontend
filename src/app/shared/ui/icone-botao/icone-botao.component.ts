import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconeBotaoTipo = 'editar' | 'excluir';

@Component({
  selector: 'app-icone-botao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icone-botao.component.html',
  styleUrl: './icone-botao.component.css'
})
export class IconeBotaoComponent {
  @Input() tipo: IconeBotaoTipo = 'editar';
  @Output() clicar = new EventEmitter<void>();

  get titulo(): string {
    return this.tipo === 'editar' ? 'Editar' : 'Excluir';
  }
}
