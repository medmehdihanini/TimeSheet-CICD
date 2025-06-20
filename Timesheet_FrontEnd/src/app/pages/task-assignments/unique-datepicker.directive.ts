import { Directive, ViewContainerRef, Input, HostListener, ElementRef } from '@angular/core';
import { MatDatepicker } from '@angular/material/datepicker';

@Directive({
  selector: '[uniqueDatepicker]',
  standalone: true
})
export class UniqueDatepickerDirective {
  @Input() uniqueDatepicker!: MatDatepicker<Date>;
  private static openPicker: MatDatepicker<Date> | null = null;

  constructor(
    public viewContainerRef: ViewContainerRef,
    private elementRef: ElementRef
  ) {}

  @HostListener('click')
  onClick(): void {
    // If there's already an open picker that's different from this one, close it
    if (UniqueDatepickerDirective.openPicker &&
        UniqueDatepickerDirective.openPicker !== this.uniqueDatepicker) {
      UniqueDatepickerDirective.openPicker.close();
    }

    // Set this picker as the currently open one
    UniqueDatepickerDirective.openPicker = this.uniqueDatepicker;
  }

  // Listen for clicks outside to help with picker management
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Check if click is outside the current picker
    if (UniqueDatepickerDirective.openPicker &&
        !this.elementRef.nativeElement.contains(event.target)) {
      // Let Angular's normal click handling occur
      // The picker will close itself if click is outside
    }
  }
}
