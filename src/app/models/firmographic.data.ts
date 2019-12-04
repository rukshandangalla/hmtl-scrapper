import { EconomicActivity } from './economic.activity';

export interface FirmographicData {
  name?: string;
  brNo?: string;
  vatRegNo?: string;
  dateOfRegistration?: string;
  telphone?: string;
  legalConstitution?: string;
  fax?: string;
  url?: string;
  economicActivityHistory?: EconomicActivity[];
}
