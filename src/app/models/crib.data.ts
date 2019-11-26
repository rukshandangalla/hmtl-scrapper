import { Address } from './address';
import { Employment } from './employment';

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
}
