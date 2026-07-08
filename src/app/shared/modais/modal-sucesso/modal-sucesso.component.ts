import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-sucesso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-sucesso.component.html',
  styleUrls: ['./modal-sucesso.component.css']
})
export class ModalSucessoComponent {
  @Input() visivel = false;
  @Input() titulo = 'Sucesso!';
  @Input() mensagem = 'Operação realizada com sucesso!';
  @Input() textoBotao = 'Voltar';
  /** Fechar clicando fora é seguro aqui, já que é só um aviso informativo. */
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
