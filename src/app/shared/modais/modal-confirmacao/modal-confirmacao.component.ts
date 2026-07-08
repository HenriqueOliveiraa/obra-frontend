import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-confirmacao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-confirmacao.component.html',
  styleUrls: ['./modal-confirmacao.component.css']
})
export class ModalConfirmacaoComponent {
  @Input() visivel = false;
  @Input() titulo = 'Confirmar ação?';
  @Input() mensagem = 'Tem certeza que deseja continuar? Essa ação não poderá ser desfeita.';
  @Input() textoCancelar = 'Cancelar';
  @Input() textoConfirmar = 'Confirmar';
  @Input() fecharAoClicarFora = false;

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar(): void {
    this.confirmar.emit();
  }

  onCancelar(): void {
    this.cancelar.emit();
  }

  onOverlayClick(): void {
    if (this.fecharAoClicarFora) {
      this.onCancelar();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.visivel) {
      this.onCancelar();
    }
  }
}
