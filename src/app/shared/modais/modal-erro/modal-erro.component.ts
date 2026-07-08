import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-erro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-erro.component.html',
  styleUrls: ['./modal-erro.component.css']
})
export class ModalErroComponent {
  @Input() visivel = false;
  @Input() titulo = 'Erro!';
  @Input() mensagem = 'Algo deu errado. Tente novamente.';
  @Input() textoBotao = 'Fechar';
  @Input() fecharAoClicarFora = true;

  @Output() fechar = new EventEmitter<void>();

  onFechar(): void {
    this.fechar.emit();
  }

  onOverlayClick(): void {
    if (this.fecharAoClicarFora) {
      this.onFechar();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.visivel) {
      this.onFechar();
    }
  }
}
