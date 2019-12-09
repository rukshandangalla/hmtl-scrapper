import { DishonourOfCheque } from './dishonour.of.cheque';

export interface DishonourOfChequeSummary {
  numberOfCheques?: string;
  cribCurrencyTypeCode?: string;
  totalAmount?: string;
  dishonouredChequeDetails?: string;
  dishonourOfCheques?: DishonourOfCheque[];
}
