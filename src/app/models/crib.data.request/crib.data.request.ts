import { CribReportPartnerDetail, CribReportSearchDetail, CribReportEmployeementDetails, CribReportLiability } from './';

export interface CribDataRequest {
  mpt_CribReportTypeEnum?: string;
  referenceNumber?: string;
  cribUserId?: string;
  reason?: string;
  productName?: string;
  reportOrderDate?: string;
  cribReportPartnerDetail?: CribReportPartnerDetail;
  cribReportSearchDetail?: CribReportSearchDetail;
  cribReportAddresses?: { mpt_CribReportAddressTypeEnum?: string, address?: string, reportedDate?: string }[];
  cribReportReportedNames?: { reference?: string }[];
  cribReportEmployeementDetails?: CribReportEmployeementDetails[];
  cribReportRelationshipDetails?: { entityId?: string, name?: string, nature?: string }[];
  cribReportLiabilities?: CribReportLiability[];
}
