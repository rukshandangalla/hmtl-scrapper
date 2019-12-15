import { DishonouredChequeDetail } from './';

export interface CribReportDishonouredChequeHeader {
  numberOfCheques?: string;
  cribCurrencyTypeCode?: string;
  totalAmount?: string;
  dishonouredChequeDetails?: DishonouredChequeDetail[];
}
