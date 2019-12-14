import { CribReportCreditFacilityRepaymentHistory, CribReportCreditFacilityOwnershipDetail } from './';

export interface CribReportCreditFacilityDetail {
  mpt_CribReportInstitutionCategoryCode?: string;
  institutionAndBranch?: string;
  mpt_CribReportCreditFacilityTypeCode?: string;
  mpt_CribReportCreditFacilityStatusCode?: string;
  mpt_CribReportCreditFacilityOwnershipTypeCode?: string;
  cribCurrencyTypeCode?: string;
  grantedAmountLimit?: string;
  currentBalance?: string;
  arrearsAmount?: string;
  installmentAmount?: string;
  writtenOffAmount?: string;
  reportedDate?: string;
  firstDisbursementDate?: string;
  latestPaymentDate?: string;
  restructuringDate?: string;
  endDate?: string;
  mpt_CribReportRepayTypeCode?: string;
  cribReportCreditFacilityPurposeCode?: string;
  cribReportCreditFacilityRepaymentHistory?: CribReportCreditFacilityRepaymentHistory[];
  cribReportCreditFacilityOwnershipDetail?: CribReportCreditFacilityOwnershipDetail;
}
