import { CribReportSettledCreditFacilityDetail, CribReportSettledCreditFacilitySummary } from '.';

export interface CribReportSettledCreditFacility {
  mpt_CribReportOwnershipTypeDescription?: string;
  cribReportSettledCreditFacilityDetail?: CribReportSettledCreditFacilityDetail[];
  cribReportSettledCreditFacilitySummary?: CribReportSettledCreditFacilitySummary[];
}
