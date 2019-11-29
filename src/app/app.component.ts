import { Component, OnInit } from '@angular/core';
import { CribData } from './models/crib.data';
import { HttpClient } from '@angular/common/http';
import { Address } from './models/address';
import { Employment } from './models/employment';
import { Liability } from './models/liability';
import { ArrearsInfo } from './models/arrears.info';
import { InquiryInfo } from './models/inquiry.info';
import { SettledInfo } from './models/settled.info';
import { SettledSlab } from './models/settled.slab';
import { SettledType } from './models/settled.type';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  cribData: CribData = {};

  constructor(private http: HttpClient) { }

  async ngOnInit() {

    /** Temp Read File */
    let cribFileContent = await this.http.get('/assets/11-054.mht', { responseType: 'text' }).toPromise();

    cribFileContent = cribFileContent.replace(/3D/g, '');
    // cribFileContent = cribFileContent.replace(/[= ]/g, '');

    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(cribFileContent, 'text/html');

    this.cribData = {
      reportDate: this.getNodeContent('#lblReportDateValue', htmlDoc),
      reportID: this.getElementContent('#texthdnTicketId', htmlDoc),
      name: this.getNodeContent('#lblNameValue', htmlDoc),
      nicNo: this.getNodeContent('#divIdentifier .text2New', htmlDoc),
      gender: this.getNodeContent('#divSurrogate .text2New', htmlDoc)
    };

    const nodes = htmlDoc.querySelectorAll('#bandsummstyle-Ver2 td.textbrownNew');

    nodes.forEach(node => {
      const title = node.innerHTML;
      if (title === 'Date of Birth') {
        this.cribData.dob = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Gender') {
        this.cribData.gender = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Citizenship') {
        this.cribData.citizenship = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Telephone Number') {
        this.cribData.telphone = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Mobile Number') {
        this.cribData.mobile = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Driving License') {
        this.cribData.dlNo = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
      if (title === 'Passport Number') {
        this.cribData.passportNo = this.clearDirtyText(node.nextElementSibling.innerHTML);
      }
    });

    const summeryTables = htmlDoc.querySelectorAll('#bandsummstyle-Ver2');

    summeryTables.forEach(tbl => {
      const tableHeader = this.clearDirtyText(tbl.querySelector('td.tblHeader').innerHTML);
      // console.log(tableHeader);

      /* Mailing Address Table */
      if (tableHeader === 'Mailing Address') {
        this.cribData.mailingAddress = [];
        this.selectTrList(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
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
        this.selectTrList(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
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
        this.selectTrList(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
          const name = this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML);
          this.cribData.reportedNames.push(name);
        });
      }
    });

    const empTable = htmlDoc.querySelector('#bandstyleEMP-Ver2');
    this.cribData.employmentData = [];
    this.selectTrList(empTable, 'tr:nth-child(n + 3)').forEach(tr => {
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
        this.selectTrList(tbl, 'tr:nth-child(n + 2)').forEach(tr => {
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
        this.selectTrList(tbl, 'tr:nth-child(n + 4)').forEach(tr => {
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
        this.selectTrList(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
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
        this.selectTrList(tbl, 'tr:nth-child(n + 3)').forEach(tr => {
          const inquiry: InquiryInfo = {
            institutionCategory: 'SELF',
            inquiryDate: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
            reason: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML)
          };
          this.cribData.inquiries.push(inquiry);
        });
      }
    });

    console.log(this.cribData);
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
      return inputStr.replace(/(\r\n|\n|\r|=)/gm, '').replace(/\s+/g, ' ').trim();
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
  selectTrList(elem: Element, param: string): NodeListOf<Element> {
    return elem.querySelectorAll(param);
  }
}
