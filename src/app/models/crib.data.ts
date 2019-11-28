import { Address } from './address';
import { Employment } from './employment';
import { Liability } from './liability';
import { ArrearsInfo } from './arrears.info';
import { InquiryInfo } from './inquiry.info';

export interface CribData {
  reportDate?: string;
  reportID?: string;
  name?: string;
  nicNo?: string;
  passportNo?: string;
  dlNo?: string;
  dob?: string;
  gender?: string;
  citizenship?: string;
  telphone?: string;
  mobile?: string;
  mailingAddress?: Address[];
  permaneentAddress?: Address[];
  reportedNames?: string[];
  employmentData?: Employment[];
  liabilities?: Liability[];
  arrearsSummery?: ArrearsInfo[];
  inquiries?: InquiryInfo[];
}
