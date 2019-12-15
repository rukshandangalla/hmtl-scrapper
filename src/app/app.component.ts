import { Component, OnInit } from '@angular/core';
import { CribData } from './models/crib.data/crib.data';
import { DemographicData } from './models/crib.data/demographic.data';
import { FirmographicData } from './models/crib.data/firmographic.data';
import { CribReportTypeEnum } from './models/crib.data/crib.report.type.enum';
import { HttpClient } from '@angular/common/http';
import { Address } from './models/crib.data/address';
import { Employment } from './models/crib.data/employment';
import { Liability } from './models/crib.data/liability';
import { ArrearsInfo } from './models/crib.data/arrears.info';
import { InquiryInfo } from './models/crib.data/inquiry.info';
import { SettledInfo } from './models/crib.data/settled.info';
import { SettledSlab } from './models/crib.data/settled.slab';
import { SettledType } from './models/crib.data/settled.type';
import { CreditFacility } from './models/crib.data/credit.facility';
import { EconomicActivity } from './models/crib.data/economic.activity';
import { DishonourOfChequeSummary } from './models/crib.data/dishonour.of.cheque.summary';
import { DishonourOfCheque } from './models/crib.data/dishonour.of.cheque';
import { CatalogueData } from './models/crib.data/catalogue.data';
import { RelationshipData } from './models/crib.data/relationship.data';

import {
  CribDataRequest,
  CribReportEmployeementDetails,
  CribReportLiability,
  CribReportDishonouredChequeHeader,
  DishonouredChequeDetail,
  CribReportStatusOfCreditFacility,
  CribReportSettledCreditFacility,
  CribReportSettledCreditFacilitySummary,
  CribReportSettledCreditFacilityDetail,
  CribReportInquiriesByLendingInstitution,
  CribReportCreditFacilityDetail,
  CribReportCreditFacilityRepaymentHistory
} from './models/crib.data.request/';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  cribData: CribData = {};

  get getCribReportType() { return CribReportTypeEnum; }

  constructor(private http: HttpClient) { }

  async ngOnInit() {

    /** Temp Read File */
    let cribFileContent = await this.http.get('/assets/09-051.mht', { responseType: 'text' }).toPromise();
    // let cribFileContent = await this.http.get('/assets/12-197.mht', { responseType: 'text' }).toPromise();
    // let cribFileContent = await this.http.get('/assets/05-047.mht', { responseType: 'text' }).toPromise();

    cribFileContent = cribFileContent.replace(/3D/g, '');
    // cribFileContent = cribFileContent.replace(/[= ]/g, '');

    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(cribFileContent, 'text/html');

    // Get Report Date & ID
    this.cribData = {
      reportDate: this.clearDirtyText(this.getNodeContent('#lblReportDateValue', htmlDoc)),
      reportID: this.clearDirtyText(this.getElementContent('#texthdnTicketId', htmlDoc)),
      userId: this.clearDirtyText(this.getNodeContent('#lblUserValue', htmlDoc)),
      reportReason: this.clearDirtyText(this.getNodeContent('#lblReasonForOrderingValue', htmlDoc)),
      reportName: this.clearDirtyText(this.getNodeContent('#lblProdNameValue', htmlDoc)),
    };

    this.cribData = this.updateReportType(this.cribData, htmlDoc);
    this.cribData = this.processSummaryData(this.cribData, htmlDoc);
    this.cribData = this.processEmployementData(this.cribData, htmlDoc);
    this.cribData = this.processRelationshipData(this.cribData, htmlDoc);
    this.cribData = this.processLiabilities(this.cribData, htmlDoc);
    this.cribData = this.processSettledData(this.cribData, htmlDoc);
    this.cribData = this.processInquiryData(this.cribData, htmlDoc);
    this.cribData = this.processCreditFacilities(this.cribData, htmlDoc);
    this.cribData = this.processDishonourOfCheques(this.cribData, htmlDoc);
    this.cribData = this.processCatalogue(this.cribData, htmlDoc);

    console.log(this.cribData);
    // Prepare Crib Request
    const request = this.prepareCribRequest(this.cribData);

    // console.log(request);
    console.log( JSON.stringify(request, null, '    ') );
  }

  /**
   * @param cribData CribData Object
   * @returns CribDataRequest
   */
  prepareCribRequest(cribData: CribData): CribDataRequest {
    const cribRequest: CribDataRequest = {
      mpt_CribReportTypeEnum: cribData.reportType,
      referenceNumber: cribData.reportID,
      cribUserId: cribData.userId,
      reason: cribData.reportReason,
      productName: cribData.reportName,
      reportOrderDate: cribData.reportDate
    };

    cribRequest.cribReportPartnerDetail = {};
    cribRequest.cribReportSearchDetail = {};

    if (cribData.reportType === CribReportTypeEnum.Consumer) {
      cribRequest.cribReportPartnerDetail.nICNumber = cribData.demographicData.nicNo;
      cribRequest.cribReportPartnerDetail.drivingLicenseNumber = cribData.demographicData.dlNo;
      cribRequest.cribReportPartnerDetail.passportNumber = cribData.demographicData.passportNo;
      cribRequest.cribReportPartnerDetail.dateOfBirth = cribData.demographicData.dob;
      cribRequest.cribReportPartnerDetail.citizenship = cribData.demographicData.citizenship;
      cribRequest.cribReportPartnerDetail.mpt_GenderDescription = cribData.demographicData.gender;
      cribRequest.cribReportPartnerDetail.maritalStatus = ''; // TODO GET - N/A in given reports
      cribRequest.cribReportPartnerDetail.spouseName = ''; // TODO GET - N/A in given reports

      cribRequest.cribReportSearchDetail.name = cribData.demographicData.name;
      cribRequest.cribReportSearchDetail.nICNumber = cribData.demographicData.nicNo;
      cribRequest.cribReportSearchDetail.mpt_GenderDescription = cribData.demographicData.gender;
      cribRequest.cribReportSearchDetail.mallingAddress = ''; // TODO GET - N/A in given reports
    }

    if (cribData.reportType === CribReportTypeEnum.Corporate) {
      cribRequest.cribReportPartnerDetail.businessRegistrationNumber = cribData.firmographicData.brNo;
      cribRequest.cribReportPartnerDetail.vatRegistrationNumber = cribData.firmographicData.vatRegNo;
      cribRequest.cribReportPartnerDetail.legalConstitution = cribData.firmographicData.legalConstitution;
      cribRequest.cribReportPartnerDetail.dateOfRegistration = cribData.firmographicData.dateOfRegistration;

      cribRequest.cribReportSearchDetail.name = cribData.firmographicData.name;
      cribRequest.cribReportSearchDetail.BusinessRegistrationNumber = cribData.firmographicData.brNo;
      cribRequest.cribReportSearchDetail.mallingAddress = ''; // TODO GET - N/A in given reports
    }

    cribRequest.cribReportAddresses = [];
    cribData.mailingAddress.forEach(ad => {
      cribRequest.cribReportAddresses.push({ mpt_CribReportAddressTypeEnum: '1', address: ad.address, reportedDate: ad.reportedDate });
    });

    cribData.permaneentAddress.forEach(ad => {
      cribRequest.cribReportAddresses.push({ mpt_CribReportAddressTypeEnum: '2', address: ad.address, reportedDate: ad.reportedDate });
    });

    cribRequest.cribReportReportedNames = [];
    cribData.reportedNames.forEach(rn => {
      cribRequest.cribReportReportedNames.push({ reference: rn });
    });

    cribRequest.cribReportEmployeementDetails = [];
    cribData.employmentData.forEach(ed => {
      const epData: CribReportEmployeementDetails = {
        employment: ed.employment,
        profession: ed.profession,
        employerName: ed.employerName,
        businessName: ed.businessName,
        businessRegistrationNumber: ed.businessRegistrationNo,
        reportedDate: ed.reportedDate
      };

      cribRequest.cribReportEmployeementDetails.push(epData);
    });

    cribRequest.cribReportRelationshipDetails = [];
    cribData.relationshipData.forEach(rd => {
      const rData = {
        entityId: rd.entityId,
        name: rd.name,
        nature: rd.nature
      };

      cribRequest.cribReportRelationshipDetails.push(rData);
    });

    cribRequest.cribReportLiabilities = [];
    cribData.liabilities.forEach(l => {
      // Skip Total element
      if (l.ownership !== 'Total') {
        const liability: CribReportLiability = {
          mpt_CribReportOwnershipTypeDescription: l.ownership,
          numberOfCreditFacilities: l.noOfFacilities,
          cribCurrencyTypeCode: l.currency,
          totalGrantedAmount: l.totalAmountGranted,
          totalOutStandingAmount: l.totalOutstanding
        };

        cribRequest.cribReportLiabilities.push(liability);
      }
    });

    cribRequest.cribReportDishonouredChequeHeader = [];
    cribData.dishonourOfChequeSummary.forEach(dc => {
      const chequeHeader: CribReportDishonouredChequeHeader = {
        cribCurrencyTypeCode: dc.cribCurrencyTypeCode,
        numberOfCheques: dc.numberOfCheques,
        totalAmount: dc.totalAmount,
        dishonouredChequeDetails: []
      };

      dc.dishonourOfCheques.forEach(dcd => {
        const chequeDetail: DishonouredChequeDetail = {
          institutionAndBranch: dcd.institution,
          chequeNumber: dcd.chequeNumber,
          amount: dcd.amount,
          dishonouredDate: dcd.dateDishonoured,
          reason: dcd.reason,
          disputed: ''
        };
        chequeHeader.dishonouredChequeDetails.push(chequeDetail);
      });

      cribRequest.cribReportDishonouredChequeHeader.push(chequeHeader);
    });

    cribRequest.cribReportStatusOfCreditFacilities = [];
    cribData.arrearsSummery.forEach(as => {
      as.arrearsSlabs.forEach(s => {
        const cribReportStatusOfCreditFacility: CribReportStatusOfCreditFacility = {
          mpt_CribReportCreditFacilityStatusDescription: as.facilityStatus,
          mpt_CribReportNumberOfDaysInArrearsCode: s.slab,
          count: s.count
        };

        cribRequest.cribReportStatusOfCreditFacilities.push(cribReportStatusOfCreditFacility);
      });
    });

    cribRequest.cribReportSettledCreditFacilities = [];
    cribData.settledSummary.forEach(summary => {
      const cribReportStatusOfCreditFacility: CribReportSettledCreditFacility = {
        mpt_CribReportOwnershipTypeDescription: summary.ownership,
        cribReportSettledCreditFacilityDetail: [],
        cribReportSettledCreditFacilitySummary: []
      };

      summary.settledTypes.forEach(type => {
        const cribReportSettledCreditFacilityDetail: CribReportSettledCreditFacilityDetail = {
          mpt_CribReportCreditFacilityTypeCode: type.cfType,
          cribCurrencyTypeCode: type.currency,
          numberOfCreditFacilities: type.noOfFacilities,
          totalGrantedAmount: type.totalAmount
        };
        cribReportStatusOfCreditFacility.cribReportSettledCreditFacilityDetail.push(cribReportSettledCreditFacilityDetail);
      });

      summary.settledSlabs.forEach(slab => {
        const cribReportSettledCreditFacilitySummary: CribReportSettledCreditFacilitySummary = {
          numberOfCreditFacilities: slab.noOfFacilities,
          cribCurrencyTypeCode: slab.currency,
          totalGrantedAmount: slab.totalAmount,
          mpt_FromMonthCode: slab.reportingPeriod.split(' ')[0],
          fromYear: slab.reportingPeriod.split(' ')[1],
          mpt_ToMonthCode: slab.reportingPeriod.split(' ')[3],
          toYear: slab.reportingPeriod.split(' ')[4],
        };
        cribReportStatusOfCreditFacility.cribReportSettledCreditFacilitySummary.push(cribReportSettledCreditFacilitySummary);
      });

      cribRequest.cribReportSettledCreditFacilities.push(cribReportStatusOfCreditFacility);
    });

    cribRequest.cribReportInquiriesByLendingInstitutions = [];
    cribData.inquiries.forEach(inq => {
      const inquery: CribReportInquiriesByLendingInstitution = {
        inquiryDate: inq.inquiryDate,
        institutionName: inq.institutionCategory, // There is a mismatch in sample and actual document
        branchName: inq.institutionCategory, // There is a mismatch in sample and actual document
        mpt_CribRequestReasonDescription: inq.reason,
        creditFacilityType: inq.facilityType,
        cribCurrencyTypeCode: inq.currency,
        amount: inq.amount
      };

      cribRequest.cribReportInquiriesByLendingInstitutions.push(inquery);
    });

    cribRequest.cribReportInquiriesBySubject = [];
    cribData.inquiries.filter(i => i.institutionCategory === 'SELF').forEach(inq => {
      cribRequest.cribReportInquiriesBySubject.push({inquiryDate: inq.inquiryDate, reason: inq.reason});
    });

    cribRequest.cribReportCreditFacilityDetails = [];
    cribData.creditFacilities.forEach(cf => {
      const creditFacility: CribReportCreditFacilityDetail = {
        mpt_CribReportInstitutionCategoryCode: cf.catalog,
        institutionAndBranch: cf.institution,
        mpt_CribReportCreditFacilityTypeCode: cf.cfType,
        mpt_CribReportCreditFacilityStatusCode: cf.cfStatus,
        mpt_CribReportCreditFacilityOwnershipTypeCode: cf.ownership,
        cribCurrencyTypeCode: cf.currency,
        grantedAmountLimit: cf.amountGrantedLimit,
        currentBalance: cf.currentBalance,
        arrearsAmount: cf.arrearsAmount,
        installmentAmount: cf.installmentAmount,
        writtenOffAmount: cf.amountWrittenOff,
        reportedDate: cf.reportedDate,
        firstDisbursementDate: cf.firstDisburseDate,
        latestPaymentDate: cf.latestPaymentDate,
        restructuringDate: cf.restructuringDate,
        endDate: cf.endDate,
        mpt_CribReportRepayTypeCode: cf.repayType,
        cribReportCreditFacilityPurposeCode: cf.purposeCode,
        cribReportCreditFacilityRepaymentHistory: [],
        cribReportCreditFacilityOwnershipDetail: {} // Why do we need something like this??
      };

      cf.paymentSlabs.forEach(p => {
        const slabAr: string[] = p.slab.split(' ');
        const repaymentHistory: CribReportCreditFacilityRepaymentHistory = {
          year: slabAr[0],
          mpt_MonthCode: slabAr[1],
          numberOfDaysInArrears: p.value
        };
        creditFacility.cribReportCreditFacilityRepaymentHistory.push(repaymentHistory);
      });

      cribRequest.cribReportCreditFacilityDetails.push(creditFacility);
    });

    cribRequest.cribReportCreditFacilityPurposes = [];
    cribData.catalogue.forEach(cat => {
      if (cat.type === 'Purp. (Credit Facility Purpose)') {
        cat.data.forEach(d => {
          cribRequest.cribReportCreditFacilityPurposes.push({ code: d.code, description: d.description });
        });
      }
    });

    return cribRequest;
  }

  updateReportType(cribData: CribData, htmlDoc: Document): CribData {
    // ** Identify consumer or corporate report ** //
    const reportType: string = this.clearDirtyText(htmlDoc.querySelector('#lblProdNameValue').innerHTML);

    if (reportType.startsWith('Corporate')) {
      cribData.reportType = CribReportTypeEnum.Corporate;
      cribData.demographicData = null;
      cribData.firmographicData = this.processCorporateData(htmlDoc);
    } else if (reportType.startsWith('Consumer')) {
      cribData.reportType = CribReportTypeEnum.Consumer;
      cribData.firmographicData = null;
      cribData.demographicData = this.processConsumerData(htmlDoc);
    } else {
      console.log('Unknown Report Type!!');
    }

    return cribData;
  }

  /**
   * Process Consumer Data
   * Demographic Details
   */
  processConsumerData(htmlDoc: Document): DemographicData {
    const demographicData: DemographicData = {};

    demographicData.name = this.getNodeContent('#lblNameValue', htmlDoc);
    demographicData.nicNo = this.getNodeContent('#divIdentifier .text2New', htmlDoc);
    demographicData.gender = this.getNodeContent('#divSurrogate .text2New', htmlDoc);

    const nodes = htmlDoc.querySelectorAll('#bandsummstyle-Ver2 td.textbrownNew');

    nodes.forEach(node => {
      const title = this.clearDirtyText(node.innerHTML);
      if (title === 'Date of Birth') {
        demographicData.dob = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Gender') {
        demographicData.gender = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Citizenship') {
        demographicData.citizenship = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Telephone Number') {
        demographicData.telphone = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Mobile Number') {
        demographicData.mobile = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Driving License') {
        demographicData.dlNo = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Passport Number') {
        demographicData.passportNo = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
    });

    return demographicData;
  }

  /**
   * Process Corporate Data
   * Firmographic Details
   */
  processCorporateData(htmlDoc: Document): FirmographicData {
    const firmographicData: FirmographicData = {};

    firmographicData.name = this.getNodeContent('#lblNameValue', htmlDoc);
    firmographicData.brNo = this.getNodeContent('#divIdentifier .text2New', htmlDoc);

    const nodes = htmlDoc.querySelectorAll('#bandsummstyle-Ver2 td.textbrownNew');

    nodes.forEach(node => {
      const title = this.clearDirtyText(node.innerHTML);
      // console.log(title);
      if (title === 'VAT Registration Number') {
        firmographicData.vatRegNo = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Date of Registration') {
        firmographicData.dateOfRegistration = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Legal Constitution') {
        firmographicData.legalConstitution = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Telephone Number') {
        firmographicData.telphone = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Fax Number') {
        firmographicData.fax = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'URL') {
        firmographicData.url = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
    });

    return firmographicData;
  }

  /**
   * Process Summary Data
   * @param cribData CribData Object
   * @returns CribData
   */
  processSummaryData(cribData: CribData, htmlDoc: Document): CribData {
    const summeryTables = htmlDoc.querySelectorAll('#bandsummstyle-Ver2');

    summeryTables.forEach(tbl => {
      const tableHeader = this.clearDirtyText(tbl.querySelector('td.tblHeader').innerHTML);

      /* Mailing Address Table */
      if (tableHeader === 'Mailing Address') {
        cribData.mailingAddress = [];
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
          const mailingAddress: Address = {
            address: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
            reportedDate: tr.querySelector('td:nth-child(3)').innerHTML
          };

          cribData.mailingAddress.push(mailingAddress);
        });
      }

      /* Permanent Address Table */
      if (tableHeader === 'Permanent Address') {
        cribData.permaneentAddress = [];
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
          const mailingAddress: Address = {
            reportedDate: tr.querySelector('td:nth-child(3)').innerHTML,
            address: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML)
          };

          cribData.permaneentAddress.push(mailingAddress);
        });
      }

      /* Reported Names Table */
      if (tableHeader === 'Reported Names') {
        cribData.reportedNames = [];
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
          const name = this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML);
          cribData.reportedNames.push(name);
        });
      }

      // Economic Activity History - Only available in corporate reports
      if (tableHeader === 'Economic Activity History' && cribData.reportType === CribReportTypeEnum.Corporate) {
        cribData.firmographicData.economicActivityHistory = [];
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
          const economicActivity: EconomicActivity = {
            activityType: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
            reportedDate: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML)
          };

          cribData.firmographicData.economicActivityHistory.push(economicActivity);
        });
      }
    });

    // Dishonoured Cheques Summary
    const dishonouredChequeTbls = htmlDoc.querySelectorAll('#bandstyleDISSUMM-Ver2');
    cribData.dishonourOfChequeSummary = [];

    dishonouredChequeTbls.forEach((tbl, i) => {
      if (i === 0) {
        let chequeHeader: DishonourOfChequeSummary = {};
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 2)').forEach(tr => {
          if (tr.getAttribute('type') !== null) {
            const td = tr.querySelector('td .tblDISHeader');
            if (td !== null) {
              const currCode = this.clearDirtyText(td.innerHTML.replace('Currency - ', ''));
              chequeHeader = { cribCurrencyTypeCode: currCode, dishonourOfCheques: [] };
            }
          } else {
            if (chequeHeader !== null) {
              chequeHeader.numberOfCheques = this.clearDirtyText(tr.querySelector('td:nth-child(1)').innerHTML);
              chequeHeader.totalAmount = this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML);

              cribData.dishonourOfChequeSummary.push(chequeHeader);
              chequeHeader = null;
            }
          }
        });
      }
    });

    return cribData;
  }

  /**
   * Process Relationship Data
   * @param cribData CribData Object
   * @returns CribData
   */
  processRelationshipData(cribData: CribData, htmlDoc: Document): CribData {
    const relationshipTables = htmlDoc.querySelectorAll('#bandstyleDIS-Ver2');
    cribData.relationshipData = [];

    relationshipTables.forEach((tbl, i) => {
      // First table is the check data - Second one -> cheque data
      if (i === 0) {
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
          const relationshipData: RelationshipData = {
            entityId: this.clearDirtyText(tr.querySelector('td:nth-child(2)').querySelector('a').innerHTML),
            name: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML),
            nature: this.clearDirtyText(tr.querySelector('td:nth-child(4)').innerHTML)
          };

          cribData.relationshipData.push(relationshipData);
        });
      }
    });

    return cribData;
  }

  /**
   * Process Employement Data
   * @param cribData CribData Object
   * @returns CribData
   */
  processEmployementData(cribData: CribData, htmlDoc: Document): CribData {
    const empTable = htmlDoc.querySelector('#bandstyleEMP-Ver2');
    cribData.employmentData = [];

    if (empTable !== null) {
      this.selectNodeListByParam(empTable, 'tr:nth-child(n + 3)').forEach(tr => {
        const empData: Employment = {
          employment: this.clearDirtyText(tr.querySelector('td:nth-child(1)').innerHTML),
          profession: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
          employerName: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML),
          businessName: this.clearDirtyText(tr.querySelector('td:nth-child(4)').innerHTML),
          businessRegistrationNo: this.clearDirtyText(tr.querySelector('td:nth-child(5)').innerHTML),
          reportedDate: this.clearDirtyText(tr.querySelector('td:nth-child(6)').innerHTML)
        };

        cribData.employmentData.push(empData);
      });
    }

    return cribData;
  }

  /**
   * Process liabilities
   * @param cribData CribData Object
   * @returns CribData
   */
  processLiabilities(cribData: CribData, htmlDoc: Document): CribData {
    const liabilityTables = htmlDoc.querySelectorAll('#bandsummstyleNew-Ver2');
    cribData.liabilities = [];
    cribData.arrearsSummery = [];
    let currentCurrency = '';
    liabilityTables.forEach((tbl, i) => {

      if (tbl.getAttribute('type') === 'freeform') {
        const currencyElement = tbl.querySelector('tr:nth-child(2)').querySelector('td:nth-child(2)');
        if (currencyElement !== null) {
          currentCurrency = this.clearDirtyText(currencyElement.innerHTML);
        }
      }

      // Liability section
      // Capture this section by row,cell (1,1) ==> Ownership
      // All table has this feature
      const ownershipElement = tbl.querySelector('tr:nth-child(1)').querySelector('td:nth-child(1)');
      if (ownershipElement !== null) {
        if (this.clearDirtyText(ownershipElement.innerHTML) === 'Ownership') {
          this.selectNodeListByParam(tbl, 'tr:nth-child(n + 2)').forEach(tr => {
            const liability: Liability = {
              currency: currentCurrency,
              ownership: this.clearDirtyText(tr.querySelector('td:nth-child(1)').innerHTML),
              noOfFacilities: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
              totalAmountGranted: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML),
              totalOutstanding: this.clearDirtyText(tr.querySelector('td:nth-child(4)').innerHTML)
            };

            cribData.liabilities.push(liability);
          });
        }
      }

      // Arrears section : capature that segment with 'Status of Credit Facilities at a Glance (Excluding Settlements)' heading
      const headerElem = tbl.querySelector('td .tblHeader');
      if (headerElem !== null && this.clearDirtyText(headerElem.innerHTML).includes('Status of')) {
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 4)').forEach(tr => {
          const arrearsSummery: ArrearsInfo = {};
          arrearsSummery.arrearsSlabs = [];
          const tdList = tr.querySelectorAll('td');
          tdList.forEach((td, j) => {
            if (j === 0) {
              arrearsSummery.facilityStatus = this.clearDirtyText(td.innerHTML);
            } else {
              if (!td.innerHTML.startsWith('<img')) {
                let slabName: string;
                switch (j) {
                  case 1:
                    slabName = '0';
                    break;
                  case 2:
                    slabName = '1-30';
                    break;
                  case 3:
                    slabName = '31-60';
                    break;
                  case 4:
                    slabName = '61-90';
                    break;
                  case 5:
                    slabName = 'Over 90';
                    break;
                  default:
                    break;
                }
                arrearsSummery.arrearsSlabs.push({ slab: slabName, count: td.innerHTML });
              }
            }
          });

          cribData.arrearsSummery.push(arrearsSummery);
        });
      }
    });

    return cribData;
  }

  /**
   * Process Settled Data
   * @param cribData CribData Object
   * @returns CribData
   */
  processSettledData(cribData: CribData, htmlDoc: Document): CribData {
    const settledTables = htmlDoc.querySelectorAll('#bandsummstyle-Ver4');
    cribData.settledSummary = [];
    const settledSummaryHeaders: string[] = [];

    settledTables.forEach((tbl, i) => {
      // Settled summery section
      if (i === 0) {
        // Extract slab headers
        const slabs = tbl.querySelector('tr:nth-child(2)').querySelectorAll('td');
        slabs.forEach((td, j) => {
          // SKIP Reporting Period text
          if (j !== 0) {
            settledSummaryHeaders.push(this.clearDirtyText(td.innerHTML).replace('Settlements from ', ''));
          }
        });

        let currentCurrencyType = '';
        let previousCurrencyType = '';

        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 4)').forEach(tr => {
          const settledSummary: SettledInfo = {
            ownership: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
            settledTypes: [],
            settledSlabs: []
          };

          currentCurrencyType = this.clearDirtyText(tr.querySelector('td:nth-child(1)').innerHTML);
          if (currentCurrencyType !== '' && currentCurrencyType !== previousCurrencyType) {
            previousCurrencyType = currentCurrencyType;
          }

          tr.querySelectorAll('td').forEach((td, k) => {
            // SKIP first two cells
            let settledSlab: SettledSlab = { currency: previousCurrencyType };
            if (k !== 0 && k !== 1) {
              const currentHeaderName = settledSummaryHeaders[Math.floor(k / 2) - 1];

              // Get previous header name
              if (settledSummary.settledSlabs.length > 0) {
                const previousHeaderName = settledSummary.settledSlabs[settledSummary.settledSlabs.length - 1].reportingPeriod;

                // Previous Obj
                if (currentHeaderName === previousHeaderName) {
                  settledSlab = settledSummary.settledSlabs[settledSummary.settledSlabs.length - 1];
                  settledSlab.totalAmount = td.innerHTML;
                } else {
                  settledSlab.reportingPeriod = currentHeaderName;
                  settledSlab.noOfFacilities = td.innerHTML;
                  settledSummary.settledSlabs.push(settledSlab);
                }
              } else {
                settledSlab.reportingPeriod = currentHeaderName;
                settledSlab.noOfFacilities = td.innerHTML;
                settledSummary.settledSlabs.push(settledSlab);
              }
            }
          });

          settledSummary.settledSlabs = settledSummary.settledSlabs.filter(slab => {
            return this.clearDirtyText(slab.noOfFacilities) !== '' && this.clearDirtyText(slab.totalAmount);
          });

          if (settledSummary.ownership !== 'Total') {
            cribData.settledSummary.push(settledSummary);
          }
        });

        // Process SettledSummary to have one type (eg: no multiple 'As Borrower' or As Guarantor)
        const finalSettledInfo: SettledInfo[] = [];

        cribData.settledSummary.forEach(summary => {
          const ownership: string = summary.ownership;
          const currentSettledInfo = finalSettledInfo.find(fs => fs.ownership === ownership);
          if (currentSettledInfo === undefined) {
            finalSettledInfo.push(summary);
          } else {
            finalSettledInfo.forEach(fs => {
              if (fs.ownership === ownership) {
                fs.settledSlabs.push(...summary.settledSlabs);
              }
            });
          }
        });

        cribData.settledSummary = finalSettledInfo;
      }


      // Settled summery details section
      if (i === 1) {
        const htmlTbl = (tbl as HTMLTableElement);

        const settledTypesB: SettledType[] = [];
        const settledTypesG: SettledType[] = [];

        let currentCurrencyType = '';
        let previousCurrencyType = '';

        // tslint:disable-next-line: prefer-for-of
        for (let j = 0; j < htmlTbl.rows.length; j++) {
          if (j > 2) {
            currentCurrencyType = this.clearDirtyText(htmlTbl.rows[j].cells[0].innerHTML);
            if (currentCurrencyType !== '' && currentCurrencyType !== previousCurrencyType) {
              previousCurrencyType = currentCurrencyType;
            }

            let settledType: SettledType = { currency: previousCurrencyType };
            settledType.cfType = this.clearDirtyText(htmlTbl.rows[j].cells[1].innerHTML);

            settledType.noOfFacilities = this.clearDirtyText(htmlTbl.rows[j].cells[2].innerHTML);
            settledType.totalAmount = this.clearDirtyText(htmlTbl.rows[j].cells[3].innerHTML);

            if (settledType.noOfFacilities !== '' && settledType.totalAmount !== '') {
              settledTypesB.push(settledType);
            }

            settledType = { currency: previousCurrencyType };
            settledType.cfType = this.clearDirtyText(htmlTbl.rows[j].cells[1].innerHTML);

            settledType.noOfFacilities = this.clearDirtyText(htmlTbl.rows[j].cells[4].innerHTML);
            settledType.totalAmount = this.clearDirtyText(htmlTbl.rows[j].cells[5].innerHTML);

            if (settledType.noOfFacilities !== '' && settledType.totalAmount !== '') {
              settledTypesG.push(settledType);
            }
          }
        }

        cribData.settledSummary.find(s => s.ownership === 'As Guarantor').settledTypes = settledTypesG;
        cribData.settledSummary.find(s => s.ownership === 'As Borrower').settledTypes = settledTypesB;
      }
    });

    return cribData;
  }

  /**
   * Process Inquiry Data
   * @param cribData CribData Object
   * @returns CribData
   */
  processInquiryData(cribData: CribData, htmlDoc: Document): CribData {
    this.cribData.inquiries = [];

    // Inquiry by lending institutions section
    const institueInquiryTables = htmlDoc.querySelectorAll('#bandstyle-Ver8');
    institueInquiryTables.forEach((tbl, i) => {
      this.selectNodeListByParam(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
        const inquiry: InquiryInfo = {
          inquiryDate: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
          institutionCategory: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML),
          reason: this.clearDirtyText(tr.querySelector('td:nth-child(4)').innerHTML),
          facilityType: this.clearDirtyText(tr.querySelector('td:nth-child(5)').innerHTML),
          currency: this.clearDirtyText(tr.querySelector('td:nth-child(6)').innerHTML),
          amount: this.clearDirtyText(tr.querySelector('td:nth-child(7)').innerHTML),
        };
        this.cribData.inquiries.push(inquiry);
      });
    });

    // Inquiry by borrower section
    const subjectInquiryTables = htmlDoc.querySelectorAll('#bandstyle-Ver3');
    subjectInquiryTables.forEach((tbl, i) => {
      this.selectNodeListByParam(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
        const inquiry: InquiryInfo = {
          institutionCategory: 'SELF',
          inquiryDate: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
          reason: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML)
        };
        this.cribData.inquiries.push(inquiry);
      });
    });

    return cribData;
  }

  /**
   * Process Credit Facilities
   * @param cribData CribData Object
   * @returns CribData
   */
  processCreditFacilities(cribData: CribData, htmlDoc: Document): CribData {
    const creditFacilityTables = htmlDoc.querySelectorAll('#bandstyle-Ver2');
    cribData.creditFacilities = [];
    const cfSlabHeaders: string[] = [];
    const creditFacilityBlockIds: number[] = [];

    // ********************************************************************************** //
    // ************** All facility tables in sequence of 1, 23, 45, 67.... ************** //
    // ********************************************************************************** //
    for (let k = 0; k <= creditFacilityTables.length / 22; k++) {
      creditFacilityBlockIds.push(22 * k + 1);
    }

    creditFacilityTables.forEach((tbl, i) => {
      // Credit Facility Details Section
      if (creditFacilityBlockIds.includes(i)) {
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 2)').forEach(tr => {
          const facility: CreditFacility = {
            id: +this.clearDirtyText(tr.querySelector('td:nth-child(1)').innerHTML),
            catalog: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
            institution: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML),
            cfType: this.clearDirtyText(tr.querySelector('td:nth-child(4)').innerHTML),
            cfStatus: this.clearDirtyText(tr.querySelector('td:nth-child(5)').innerHTML),
            ownership: this.clearDirtyText(tr.querySelector('td:nth-child(6)').innerHTML),
            currency: this.clearDirtyText(tr.querySelector('td:nth-child(7)').innerHTML),
            amountGrantedLimit: this.clearDirtyText(tr.querySelector('td:nth-child(8)').innerHTML),
            currentBalance: this.clearDirtyText(tr.querySelector('td:nth-child(9)').innerHTML),
            arrearsAmount: this.clearDirtyText(tr.querySelector('td:nth-child(10)').innerHTML),
            installmentAmount: this.clearDirtyText(tr.querySelector('td:nth-child(11)').innerHTML),
            amountWrittenOff: this.clearDirtyText(tr.querySelector('td:nth-child(12)').innerHTML),
            reportedDate: this.clearDirtyText(tr.querySelector('td:nth-child(13)').innerHTML),
            firstDisburseDate: this.clearDirtyText(tr.querySelector('td:nth-child(14)').innerHTML),
            latestPaymentDate: this.clearDirtyText(tr.querySelector('td:nth-child(15)').innerHTML),
            restructuringDate: this.clearDirtyText(tr.querySelector('td:nth-child(16)').innerHTML),
            endDate: this.clearDirtyText(tr.querySelector('td:nth-child(17)').innerHTML),
            repayType: this.clearDirtyText(tr.querySelector('td:nth-child(18)').innerHTML),
            // TODO: Read purpose from summery, No need if this available from backend
            purposeCode: this.clearDirtyText(tr.querySelector('td:nth-child(19)').innerHTML),
            coverage: this.clearDirtyText(tr.querySelector('td:nth-child(20)').innerHTML),
            paymentSlabs: []
          };

          cribData.creditFacilities.push(facility);
        });
      }

      // Slab Headers: coming from table header
      if (i === 2) {
        this.selectNodeListByParam(tbl, 'tr').forEach(tr => {
          // Loop through td list
          this.selectNodeListByParam(tr, 'td').forEach((td, j) => {
            // Skip 'no' from headers
            if (j !== 0) {
              cfSlabHeaders.push(this.clearDirtyText(td.innerHTML));
            }
          });
        });
      }

      // Skip last two tables as it has disclaimer and legend
      if (i >= 3 && i < (creditFacilityTables.length - 2)) {
        this.selectNodeListByParam(tbl, 'tr').forEach(tr => {
          let creditFacility: CreditFacility;
          // Loop through td list
          this.selectNodeListByParam(tr, 'td').forEach((td, j) => {

            // Get the facility id, it's in column 1 : then find the relevent CF
            if (j === 0) {
              creditFacility = {};
              creditFacility = cribData.creditFacilities.find(cf => cf.id === +this.clearDirtyText(td.innerHTML));
            } else {
              if (creditFacility !== undefined && !creditFacilityBlockIds.includes(i)) {
                const slabValue: string = this.clearDirtyText(td.innerHTML) === 'OK' ? '0' : this.clearDirtyText(td.innerHTML);
                creditFacility.paymentSlabs.push({ slab: cfSlabHeaders[j - 1], value: slabValue });
              }
            }
          });

          // Inserting payment slab to credit facility
          cribData.creditFacilities.forEach(cf => {
            if (creditFacility && creditFacility !== undefined && cf.id === creditFacility.id) {
              cf.paymentSlabs = creditFacility.paymentSlabs;
            }
          });

          creditFacility = null;
        });
      }
    });

    return cribData;
  }

  /**
   * Process Dishonour Of Cheques - Depends on DishonourOfChequeSummary
   * @param cribData CribData Object
   * @returns CribData
   */
  processDishonourOfCheques(cribData: CribData, htmlDoc: Document): CribData {
    const dishonourOfChequeTables = htmlDoc.querySelectorAll('#bandstyleDIS-Ver2');
    dishonourOfChequeTables.forEach((tbl, i) => {
      // Second table is the cheque data - First one -> relationships
      if (i === 1) {
        let currCode = '';

        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 2)').forEach(tr => {
          if (tr.getAttribute('type') !== null) {
            const td = tr.querySelector('td .tblDISHeader');
            if (td !== null) {
              currCode = this.clearDirtyText(td.innerHTML.replace('Currency - ', ''));
            }
          } else {
            const dishonourOfCheque: DishonourOfCheque = {
              institution: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
              chequeNumber: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML),
              amount: this.clearDirtyText(tr.querySelector('td:nth-child(4)').innerHTML),
              dateDishonoured: this.clearDirtyText(tr.querySelector('td:nth-child(5)').innerHTML),
              reason: this.clearDirtyText(tr.querySelector('td:nth-child(6)').innerHTML)
            };

            this.cribData.dishonourOfChequeSummary.forEach(dc => {
              if (dc.cribCurrencyTypeCode === currCode) {
                dc.dishonourOfCheques.push(dishonourOfCheque);
              }
            });
          }
        });
      }
    });

    return cribData;
  }

  /**
   * Process Catalogue
   * @param cribData CribData Object
   * @returns CribData
   */
  processCatalogue(cribData: CribData, htmlDoc: Document): CribData {
    const catalogueTables = htmlDoc.querySelectorAll('#bandsummstyle-Ver2');
    cribData.catalogue = [];
    const catHeaders: { type: string, trIndex: number, childIndexs?: number[] }[] = [];
    let dataList: number[] = [];

    catalogueTables.forEach((tbl, i) => {
      // Always last table is Catalogue
      if (i === (catalogueTables.length - 1)) {
        const nodeList = this.selectNodeListByParam(tbl, 'tr');

        nodeList.forEach((tr, j) => {
          // Skip 'Catalogue Description' heading
          if (j !== 0) {
            const header = tr.querySelector('td.tblHeader');
            if (nodeList.length === (j + 1)) {
              catHeaders[catHeaders.length - 1].childIndexs = dataList;
            }

            if (header !== null) {
              if (catHeaders.length > 0) {
                catHeaders[catHeaders.length - 1].childIndexs = dataList;
              }

              catHeaders.push({ type: this.clearDirtyText(header.innerHTML), trIndex: j, childIndexs: [] });
              dataList = [];
            } else {
              dataList.push(j);
            }
          }
        });

        // Remove all the first element from the arrays
        catHeaders.forEach(cat => {
          cat.childIndexs.shift();
        });

        this.selectNodeListByParam(tbl, 'tr').forEach((tr, j) => {
          const currentCatHeader = catHeaders.find(ch => ch.trIndex === j);
          const dataCatHeader = catHeaders.find(ch => ch.childIndexs.includes(j));

          if (currentCatHeader !== undefined) {
            const catData: CatalogueData = {
              type: currentCatHeader.type,
              data: []
            };
            cribData.catalogue.push(catData);
          }

          if (dataCatHeader !== undefined) {
            const code = this.clearDirtyText(tr.querySelector('td:nth-child(1)').innerHTML);
            const desc = this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML);

            cribData.catalogue.find(c => c.type === dataCatHeader.type).data.push({ code, description: desc });
          }
        });
      }
    });

    return cribData;
  }

  /**
   * Upload Process Method
   */
  uploadHandler(event) {
    const file = event.files[0];
    const reader = new FileReader();
    reader.onload = (readerEvt: any) => {

      let content = readerEvt.target.result;

      content = content.replace(/3D/g, '');

      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(content, 'text/html');

      this.cribData = {
        reportDate: this.getNodeContent('#lblReportDateValue', htmlDoc),
        reportID: this.getElementContent('#texthdnTicketId', htmlDoc)
      };

      console.log(this.cribData);
    };

    reader.readAsText(file);
  }

  /**
   * Get node content by css selector
   */
  getNodeContent(selector: string, htmlDoc: Document): string {
    return htmlDoc.querySelectorAll(selector)[0].innerHTML;
  }

  /**
   * Get element content by css query
   */
  getElementContent(selector: string, htmlDoc: Document): string {
    return (htmlDoc.querySelectorAll(selector)[0] as HTMLInputElement).value;
  }

  /**
   * Clear innerHTML with img data or dirty text
   */
  clearDirtyText(inputStr: string): string {
    if (!inputStr.startsWith('<img')) {
      if (!inputStr.startsWith('--')) {
        return inputStr.replace(/(\r\n|\n|\r|=)/gm, '').replace(/\s+/g, ' ').trim().replace('&amp;', '&');
      } else {
        return null;
      }
    } else {
      // because: Report empty indicated using this foolish method
      // => https://crims.crib.lk/HTML/Images/spacer.gif OR <img "" src"https://crims.crib.lk/HTML/Images/c_ND.gif">
      // it means, if inputStr starts with <img that's a empty
      return null;
    }
  }

  /**
   * Get the tr list by nth selector
   *
   */
  selectNodeListByParam(elem: Element, param: string): NodeListOf<Element> {
    return elem.querySelectorAll(param);
  }
}
