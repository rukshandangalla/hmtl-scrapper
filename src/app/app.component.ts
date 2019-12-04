import { Component, OnInit } from '@angular/core';
import { CribData } from './models/crib.data';
import { DemographicData } from './models/demographic.data';
import { FirmographicData } from './models/firmographic.data';
import { CribReportTypeEnum } from './models/crib.report.type.enum';
import { HttpClient } from '@angular/common/http';
import { Address } from './models/address';
import { Employment } from './models/employment';
import { Liability } from './models/liability';
import { ArrearsInfo } from './models/arrears.info';
import { InquiryInfo } from './models/inquiry.info';
import { SettledInfo } from './models/settled.info';
import { SettledSlab } from './models/settled.slab';
import { SettledType } from './models/settled.type';
import { CreditFacility } from './models/credit.facility';

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
    // let cribFileContent = await this.http.get('/assets/11-054.mht', { responseType: 'text' }).toPromise();

    cribFileContent = cribFileContent.replace(/3D/g, '');
    // cribFileContent = cribFileContent.replace(/[= ]/g, '');

    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(cribFileContent, 'text/html');

    // Get Report Date & ID
    this.cribData = {
      reportDate: this.getNodeContent('#lblReportDateValue', htmlDoc),
      reportID: this.getElementContent('#texthdnTicketId', htmlDoc)
    };

    this.cribData = this.updateReportType(this.cribData, htmlDoc);
    this.cribData = this.processSummaryData(this.cribData, htmlDoc);
    this.cribData = this.processEmployementData(this.cribData, htmlDoc);
    this.cribData = this.processLiabilities(this.cribData, htmlDoc);
    this.cribData = this.processSettledData(this.cribData, htmlDoc);
    this.cribData = this.processInquiryData(this.cribData, htmlDoc);
    this.cribData = this.processCreditFacilities(this.cribData, htmlDoc);

    console.log(this.cribData);
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
      const title = node.innerHTML;
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
      // console.log(tableHeader);

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

    liabilityTables.forEach((tbl, i) => {

      // Liability section
      if (i === 1) {
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 2)').forEach(tr => {
          const liability: Liability = {
            ownership: this.clearDirtyText(tr.querySelector('td:nth-child(1)').innerHTML),
            noOfFacilities: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
            totalAmountGranted: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML),
            totalOutstanding: this.clearDirtyText(tr.querySelector('td:nth-child(4)').innerHTML)
          };

          cribData.liabilities.push(liability);
        });
      }

      // Liability section
      if (i === 2) {
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
                    slabName = 'over 90';
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

        // Extract Data : Assuming only two types of data -> As Borrower & As Guarantor
        [tbl.querySelector('tr:nth-child(4)'), tbl.querySelector('tr:nth-child(5)')].forEach(tr => {
          const settledSummary: SettledInfo = {
            ownership: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
            settledTypes: []
          };

          settledSummary.settledSlabs = [];
          tr.querySelectorAll('td').forEach((td, k) => {
            // console.log(k / 2, k % 2);
            // SKIP first two cells
            if (k !== 0 && k !== 1) {
              // console.log(Math.floor(k / 2) - 1);
              // console.log(td.innerHTML, settledSummaryHeaders[Math.floor(k / 2) - 1]);

              const currentHeaderName = settledSummaryHeaders[Math.floor(k / 2) - 1];

              let settledSlab: SettledSlab = {};

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

          cribData.settledSummary.push(settledSummary);
        });
      }

      // Settled summery details section
      if (i === 1) {
        const htmlTbl = (tbl as HTMLTableElement);

        const settledTypesB: SettledType[] = [];
        const settledTypesG: SettledType[] = [];

        // tslint:disable-next-line: prefer-for-of
        for (let j = 0; j < htmlTbl.rows.length; j++) {

          if (j > 2) {
            let settledType: SettledType = {};
            settledType.cfType = this.clearDirtyText(htmlTbl.rows[j].cells[1].innerHTML);

            settledType.noOfFacilities = this.clearDirtyText(htmlTbl.rows[j].cells[2].innerHTML);
            settledType.totalAmount = this.clearDirtyText(htmlTbl.rows[j].cells[3].innerHTML);

            if (settledType.noOfFacilities !== '' && settledType.totalAmount !== '') {
              settledTypesB.push(settledType);
            }

            settledType = {};
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
    const inquiryTables = htmlDoc.querySelectorAll('#bandstyle-Ver8');
    this.cribData.inquiries = [];

    inquiryTables.forEach((tbl, i) => {
      // Inquiry by lending institutions section
      if (i === 0) {
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
      }
      // Inquiry by borrower section
      if (i === 1) {
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
          const inquiry: InquiryInfo = {
            institutionCategory: 'SELF',
            inquiryDate: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
            reason: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML)
          };
          this.cribData.inquiries.push(inquiry);
        });
      }
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
        // console.log(tbl);
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
                // console.log(creditFacility, j, i);
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
