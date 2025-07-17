import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleFormat',
  standalone: true
})
export class RoleFormatPipe implements PipeTransform {
  transform(role: string): string {
    if (!role) return '';

    // Remove underscores and map to French terms
    switch(role) {
      case 'SUPER_ADMIN':
        return 'Super Administrateur';
      case 'PARTNER':
        return 'Partenaire';
      case 'GPS_LEAD':
        return 'Chef GPS';
      case 'PROGRAM_MANAGER':
        return 'Chef de Programme';
      case 'PROJECT_MANAGER':
        return 'Chef de Projet';
      default:
        // Fallback: Just replace underscores with spaces and capitalize
        return role.replace(/_/g, ' ').toLowerCase()
          .replace(/\b\w/g, char => char.toUpperCase());
    }
  }
}
