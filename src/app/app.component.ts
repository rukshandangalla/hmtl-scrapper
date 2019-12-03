import { Component, OnInit } from '@angular/core';
import { CribData } from './models/crib.data';
import { CribReportTypeEnum } from './models/crib.report.type.enum';
import { cribData } from './models/consumer.crib.data';
import { CorporateCribData } from './models/corporate.crib.data';
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
import { DemographicData } from './models/demographic.data';
import { FirmographicData } from './models/firmographic.data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  cribData: cribData = {};

  get getCribReportType() { return CribReportTypeEnum; }

  constructor(private http: HttpClient) { }


  async ngOnInit() {

    /** Temp Read File */
    // let cribFileContent = await this.http.get('/assets/09-051.mht', { responseType: 'text' }).toPromise();
    let cribFileContent = await this.http.get('/assets/11-054.mht', { responseType: 'text' }).toPromise();

    cribFileContent = cribFileContent.replace(/3D/g, '');
    // cribFileContent = cribFileContent.replace(/[= ]/g, '');

    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(cribFileContent, 'text/html');

    // Get Report Date & ID
    this.cribData = {
      reportDate: this.getNodeContent('#lblReportDateValue', htmlDoc),
      reportID: this.getElementContent('#texthdnTicketId', htmlDoc)
    };

    // ** Identify consumer or corporate report ** //
    const reportType: string = this.clearDirtyText(htmlDoc.querySelector('#lblProdNameValue').innerHTML);

    if (reportType.startsWith('Corporate')) {
      this.cribData.reportType = CribReportTypeEnum.Corporate;
      this.cribData.demographicData = null;
      this.cribData.firmographic = this.processCorporateData(htmlDoc);
    } else if (reportType.startsWith('Consumer')) {
      this.cribData.reportType = CribReportTypeEnum.Consumer;
      this.cribData.firmographic = null;
      this.cribData.demographicData = this.processConsumerData(htmlDoc);
    } else {
      console.log('Unknown Report Type!!');
    }

    const summeryTables = htmlDoc.querySelectorAll('#bandsummstyle-Ver2');

    summeryTables.forEach(tbl => {
      const tableHeader = this.clearDirtyText(tbl.querySelector('td.tblHeader').innerHTML);
      // console.log(tableHeader);

      /* Mailing Address Table */
      if (tableHeader === 'Mailing Address') {
        this.cribData.mailingAddress = [];
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
          const mailingAddress: Address = {
            address: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
            reportedDate: tr.querySelector('td:nth-child(3)').innerHTML
          };

          this.cribData.mailingAddress.push(mailingAddress);
        });
      }

      /* Permanent Address Table */
      if (tableHeader === 'Permanent Address') {
        this.cribData.permaneentAddress = [];
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
          const mailingAddress: Address = {
            reportedDate: tr.querySelector('td:nth-child(3)').innerHTML,
            address: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML)
          };

          this.cribData.permaneentAddress.push(mailingAddress);
        });
      }

      /* Reported Names Table */
      if (tableHeader === 'Reported Names') {
        this.cribData.reportedNames = [];
        this.selectNodeListByParam(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
          const name = this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML);
          this.cribData.reportedNames.push(name);
        });
      }
    });

    const empTable = htmlDoc.querySelector('#bandstyleEMP-Ver2');
    this.cribData.employmentData = [];
    this.selectNodeListByParam(empTable, 'tr:nth-child(n + 3)').forEach(tr => {
      const empData: Employment = {
        employment: this.clearDirtyText(tr.querySelector('td:nth-child(1)').innerHTML),
        profession: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
        employerName: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML),
        businessName: this.clearDirtyText(tr.querySelector('td:nth-child(4)').innerHTML),
        businessRegistrationNo: this.clearDirtyText(tr.querySelector('td:nth-child(5)').innerHTML),
        reportedDate: this.clearDirtyText(tr.querySelector('td:nth-child(6)').innerHTML)
      };

      // console.log(empData);
      this.cribData.employmentData.push(empData);
    });

    const liabilityTables = htmlDoc.querySelectorAll('#bandsummstyleNew-Ver2');
    this.cribData.liabilities = [];
    this.cribData.arrearsSummery = [];

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

          this.cribData.liabilities.push(liability);
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

          this.cribData.arrearsSummery.push(arrearsSummery);
        });
      }
    });

    const settledTables = htmlDoc.querySelectorAll('#bandsummstyle-Ver4');
    this.cribData.settledSummary = [];
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

          this.cribData.settledSummary.push(settledSummary);
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

        this.cribData.settledSummary.find(s => s.ownership === 'As Guarantor').settledTypes = settledTypesG;
        this.cribData.settledSummary.find(s => s.ownership === 'As Borrower').settledTypes = settledTypesB;
      }
    });

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


    const creditFacilityTables = htmlDoc.querySelectorAll('#bandstyle-Ver2');
    this.cribData.creditFacilities = [];
    const cfSlabHeaders: string[] = [];
    creditFacilityTables.forEach((tbl, i) => {
      // Credit Facility Details Section
      if (i === 1) {
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
            purposeCode: this.clearDirtyText(tr.querySelector('td:nth-child(19)').innerHTML), // TODO: Read purpose from summery
            coverage: this.clearDirtyText(tr.querySelector('td:nth-child(20)').innerHTML),
            paymentSlabs: []
          };

          this.cribData.creditFacilities.push(facility);
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

            // creditFacility.paymentSlabs = [];

            // Get the facility id, it's in column 1 : then find the relevent CF
            if (j === 0) {
              creditFacility = {};
              creditFacility = this.cribData.creditFacilities.find(cf => cf.id === +this.clearDirtyText(td.innerHTML));
            } else {
              const slabValue: string = this.clearDirtyText(td.innerHTML) === 'OK' ? '0' : this.clearDirtyText(td.innerHTML);
              creditFacility.paymentSlabs.push({ slab: cfSlabHeaders[j - 1], value: slabValue });
            }
          });

          // Inserting payment slab to credit facility
          this.cribData.creditFacilities.forEach(cf => {
            if (creditFacility && cf.id === creditFacility.id) {
              cf.paymentSlabs = creditFacility.paymentSlabs;
            }
          });

          creditFacility = null;
        });
      }
    });

    console.log(this.cribData);
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
   * Upload Process Method
   *
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
        reportID: this.getElementContent('#texthdnTicketId', htmlDoc),
        name: this.getNodeContent('#lblNameValue', htmlDoc),
        nicNo: this.getNodeContent('#divIdentifier .text2New', htmlDoc)
      };

      console.log(this.cribData);
    };

    reader.readAsText(file);
  }

  getNodeContent(selector: string, htmlDoc: Document): string {
    return htmlDoc.querySelectorAll(selector)[0].innerHTML;
  }

  getElementContent(selector: string, htmlDoc: Document): string {
    return (htmlDoc.querySelectorAll(selector)[0] as HTMLInputElement).value;
  }

  clearDirtyText(inputStr: string): string {
    if (!inputStr.startsWith('<img')) {
      if (!inputStr.startsWith('--')) {
        return inputStr.replace(/(\r\n|\n|\r|=)/gm, '').replace(/\s+/g, ' ').trim().replace('&amp;', '&');
      } else {
        return 'N/A';
      }
    } else {
      // because: Report empty indicated using this foolish method
      // => https://crims.crib.lk/HTML/Images/spacer.gif OR <img "" src"https://crims.crib.lk/HTML/Images/c_ND.gif">
      // it means, if inputStr starts with <img that's a empty
      return 'N/A';
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
