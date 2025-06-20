import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-program-bill',
  templateUrl: './program-bill.component.html',
  styleUrls: ['./program-bill.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class ProgramBillComponent {
  programId: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const parentRoute = this.route.parent;
    if (parentRoute) {
      this.programId = parentRoute.snapshot.paramMap.get('id');
    }

  }
}
