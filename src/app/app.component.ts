import { Component, OnInit } from '@angular/core';
import { CribData } from './models/crib.data';
import { HttpClient } from '@angular/common/http';
import { Address } from './models/address';

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
    let cribFileContent = await this.http.get('/assets/temp/CR_KUMARA.mht', { responseType: 'text' }).toPromise();

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

    const allTables = htmlDoc.querySelectorAll('#bandsummstyle-Ver2');

    allTables.forEach(tbl => {
      const tableHeader = tbl.querySelector('td.tblHeader').innerHTML.replace(/=/g, '');
      if (tableHeader === 'Mailing Address') {
        // tr list of the table: skip two tr *Header and Column Names*
        const trList = tbl.querySelectorAll('tr:nth-child(n + 3)');

        this.cribData.mailingAddress = [];
        trList.forEach(tr => {
          // address
          const mailingAddress: Address = {
            reportedDate: tr.querySelector('td:nth-child(2)').innerHTML,
            address: tr.querySelector('td:nth-child(2)').innerHTML
          };

          this.cribData.mailingAddress.push(mailingAddress);
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
}
