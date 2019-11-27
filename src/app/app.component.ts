import { Component, OnInit } from '@angular/core';
import { CribData } from './models/crib.data';
import { HttpClient } from '@angular/common/http';
import { Address } from './models/address';
import { Employment } from './models/employment';
import { Liability } from './models/liability';

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
    let cribFileContent = await this.http.get('/assets/11-064.mht', { responseType: 'text' }).toPromise();

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
        this.cribData.dob = node.nextElementSibling.innerHTML;
      }
      if (title === 'Gender') {
        this.cribData.gender = node.nextElementSibling.innerHTML;
      }
      if (title === 'Citizenship') {
        this.cribData.citizenship = node.nextElementSibling.innerHTML;
      }
      if (title === 'Telephone Number') {
        this.cribData.telphone = node.nextElementSibling.innerHTML;
      }
      if (title === 'Mobile Number') {
        this.cribData.mobile = node.nextElementSibling.innerHTML;
      }
      if (title === 'Driving License') {
        this.cribData.dlNo = node.nextElementSibling.innerHTML;
      }
      if (title === 'Passport Number') {
        this.cribData.passportNo = node.nextElementSibling.innerHTML;
      }
    });

    const summeryTables = htmlDoc.querySelectorAll('#bandsummstyle-Ver2');

    summeryTables.forEach(tbl => {
      const tableHeader = this.clearDirtyText(tbl.querySelector('td.tblHeader').innerHTML);
      // console.log(tableHeader);

      /* Mailing Address Table */
      if (tableHeader === 'Mailing Address') {
        // tr list of the table: skip two tr *Header and Column Names*
        const trList = tbl.querySelectorAll('tr:nth-child(n + 3)');

        this.cribData.mailingAddress = [];
        trList.forEach(tr => {
          const mailingAddress: Address = {
            address: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
            reportedDate: tr.querySelector('td:nth-child(3)').innerHTML
          };

          this.cribData.mailingAddress.push(mailingAddress);
        });
      }

      /* Permanent Address Table */
      if (tableHeader === 'Permanent Address') {
        // tr list of the table: skip two tr *Header and Column Names*
        const trList = tbl.querySelectorAll('tr:nth-child(n + 3)');

        this.cribData.permaneentAddress = [];
        trList.forEach(tr => {
          const mailingAddress: Address = {
            reportedDate: tr.querySelector('td:nth-child(3)').innerHTML,
            address: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML)
          };

          this.cribData.permaneentAddress.push(mailingAddress);
        });
      }

      /* Reported Names Table */
      if (tableHeader === 'Reported Names') {
        // tr list of the table: skip two tr *Header and Column Names*
        const trList = tbl.querySelectorAll('tr:nth-child(n + 3)');

        this.cribData.reportedNames = [];
        trList.forEach(tr => {
          const name = this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML);
          this.cribData.reportedNames.push(name);
        });
      }
    });

    const empTable = htmlDoc.querySelector('#bandstyleEMP-Ver2');
    const trList = empTable.querySelectorAll('tr:nth-child(n + 3)');
    this.cribData.employmentData = [];
    trList.forEach(tr => {
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
    liabilityTables.forEach((tbl, i) => {

      // Liability section
      if (i === 1) {
        const trList = tbl.querySelectorAll('tr:nth-child(n + 2)');
        trList.forEach(tr => {
          const liability: Liability = {
            ownership: this.clearDirtyText(tr.querySelector('td:nth-child(1)').innerHTML),
            noOfFacilities: this.clearDirtyText(tr.querySelector('td:nth-child(2)').innerHTML),
            totalAmountGranted: this.clearDirtyText(tr.querySelector('td:nth-child(3)').innerHTML),
            totalOutstanding: this.clearDirtyText(tr.querySelector('td:nth-child(4)').innerHTML)
          };

          this.cribData.liabilities.push(liability);
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
    return inputStr.replace(/(\r\n|\n|\r|=)/gm, '').replace(/\s+/g, ' ').trim();
  }
}
