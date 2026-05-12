import { ItemStatus } from '@/services/itemService';

export function getItemStatusLabel(status: ItemStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Disponible';
    case 'RESERVED':
      return 'Apartada';
    case 'SOLD':
      return 'Vendida';
    case 'DISABLED':
      return 'Deshabilitada';
    case 'ON_CONSIGNMENT':
      return 'En consignación';
    default:
      return status;
  }
}