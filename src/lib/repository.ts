import { properties, zones } from '@/data/mock';
import type { PropertyRepository } from '@/types/real-estate';
export const normalize = (text: string) => text.toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
// Replace this adapter with an HTTP implementation; UI contracts stay unchanged.
export const mockRepository: PropertyRepository = {
  async getZones() { return zones; },
  async findProperties({ query }) {
    const needle = normalize(query);
    return properties.filter(p => normalize(`${p.title} ${p.address} ${zones.find(z => z.id === p.zoneId)?.name}`).includes(needle));
  },
};
export const money = (value: number) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1, useGrouping: true }).format(value);
