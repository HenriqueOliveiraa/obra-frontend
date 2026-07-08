import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-sair',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-sair.component.html',
  styleUrls: ['./modal-sair.component.css']
})
export class ModalSairComponent {
  @Input() visivel = false;
  @Input() titulo = 'Sair?';
  @Input() mensagem = 'Você está prestes a sair da edição, todos os dados alterados serão perdidos. Essa ação não poderá ser desfeita.';
  @Input() textoVoltar = 'Voltar';
  @Input() textoContinuar = 'Continuar';
  @Output() continuar = new EventEmitter<void>();
  @Output() voltar = new EventEmitter<void>();

  onContinuar(): void {
    this.continuar.emit();
  }

  onVoltar(): void {
    this.voltar.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.visivel) {
      this.onVoltar();
    }
  }
}
