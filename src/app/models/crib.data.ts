import { DemographicData } from './demographic.data';
import { FirmographicData } from './firmographic.data';
import { Address } from './address';
import { Employment } from './employment';
import { Liability } from './liability';
import { ArrearsInfo } from './arrears.info';
import { InquiryInfo } from './inquiry.info';
import { SettledInfo } from './settled.info';
import { CreditFacility } from './credit.facility';
import { CribReportTypeEnum } from './crib.report.type.enum';
import { DishonourOfCheque } from './dishonour.of.cheque';
import { CatalogueData } from './catalogue.data';

export interface CribData {
  reportType?: CribReportTypeEnum;
  reportDate?: string;
  reportID?: string;
  demographicData?: DemographicData;
  firmographicData?: FirmographicData;
  mailingAddress?: Address[];
  permaneentAddress?: Address[];
  reportedNames?: string[];
  employmentData?: Employment[];
  liabilities?: Liability[];
  arrearsSummery?: ArrearsInfo[];
  inquiries?: InquiryInfo[];
  settledSummary?: SettledInfo[];
  creditFacilities?: CreditFacility[];
  dishonourOfCheques?: DishonourOfCheque[];
  catalogue?: CatalogueData[];
}
