import { CreditFacilitySlab } from './credit.facility.slab';

export interface CreditFacility {
  id?: number;
  catalog?: string;
  institution?: string;
  cfType?: string;
  cfStatus?: string;
  ownership?: string;
  currency?: string;
  amountGrantedLimit?: string;
  currentBalance?: string;
  arrearsAmount?: string;
  installmentAmount?: string;
  amountWrittenOff?: string;
  reportedDate?: string;
  firstDisburseDate?: string;
  latestPaymentDate?: string;
  restructuringDate?: string;
  endDate?: string;
  repayType?: string;
  purposeCode?: string;
  purpose?: string;
  coverage?: string;
  paymentSlabs?: CreditFacilitySlab[];
}
