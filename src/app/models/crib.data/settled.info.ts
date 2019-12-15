import { SettledSlab } from './settled.slab';
import { SettledType } from './settled.type';

export interface SettledInfo {
  ownership?: string;
  settledSlabs?: SettledSlab[];
  settledTypes?: SettledType[];
}
