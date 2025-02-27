import { Component, Inject, OnInit,ViewChild  } from '@angular/core';
import { MatDialogRef,MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import {environment} from '../constant/api-constants';
import { NotificationPopupService } from '../notification-popup/notification-popup.service';
import { DownloadPdfService } from '../service/downlaodPdf.service';

@Component({
  selector: 'app-remittance-popup',
  templateUrl: './remittance-popup.component.html',
  styleUrl: './remittance-popup.component.css'
})
export class RemittancePopupComponent implements OnInit {
 @ViewChild('myForm') myForm: any;
  
  id:number = 0;
  contractorname: string = '';
  
  paidAmount:string = '';
  currencytype :string='';
  selfbillinvoice:string = '';
  InvoiceAmount:string = '';
  duedate:string = '';
  invoiceNumber: string = '';
  invoiceDate: string = '';
  
  imageName: string = '';
  thumbImage: string = '';
  fullImagePath: string = '';
  
  isPopupVisible: boolean = true;
  ctcCode: number = 0;
  gridCtcCode: number = 0;
  submitted = false;
  errors: any = {};
  IsContractIsActiveOrNot:any;
  imageWidth: number = 792;
  pdfFileName:string="";
  uplodedPDFFile:string="";
  loading: boolean = false;
  imageHeight: number = 490;


  constructor(
    
    private dialogRef: MatDialogRef<RemittancePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient, // Injecting HttpClient service
    private notificationService: NotificationPopupService, // Inject service,
    private downloadPdfService: DownloadPdfService
  ) 
  {
    
    this.setImagePath(data.pdF_Image_FileName, data.pdF_FileName);
  }

  
  setImagePath(filePath: string, pdfFile: string): void {
    this.imageName = filePath;
    this.uplodedPDFFile =pdfFile;
    //server
    this.thumbImage = `assets/documents/remittance/image/${this.imageName}`;
    this.fullImagePath = `assets/documents/remittance/image/${this.imageName}`;
    this.pdfFileName =`assets/documents/remittance/pdf/${this.uplodedPDFFile}`;

  //Local
    // this.pdfFileName =`assets/documents/remittance/pdf/Remittanceadvice.pdf`;
    // this.thumbImage = `assets/documents/remittance/image/xyz.png`;
    // this.fullImagePath = `assets/documents/remittance/image/xyz.png`;
  
    console.log('Thumb Image:', this.thumbImage);
    console.log('Full Image Path:', this.fullImagePath);

    console.log('Full pdfFileName  Path:', this.pdfFileName);
  }
  

  ngOnInit(): void {
    this.initializeFormData();
  }

  initializeFormData(): void {
    if (this.data) {
      //debugger
      console.log(this.data);
      
      this.id = this.data.id;
      this.contractorname = this.data.contractorName || '';
      
      this.IsContractIsActiveOrNot = this.data.errorMessage;
      this.currencytype = this.data.currencyType || '';
      this.invoiceNumber = this.data.invoiceNumber || '';
      this.duedate = this.data.dueDate || '';
      this.selfbillinvoice = this.data.selfBillInvoiceNo || '';
      // Remove currency 
      this.paidAmount = this.data.paidAmount.includes(' ') ? this.data.paidAmount.split(' ')[0] : this.data.paidAmount.trim();
      this.InvoiceAmount = this.data.invoiceAmount || '';
      this.invoiceDate = this.data.invoiceDate || '';
      //this.groupNewId = this.data.grouP_NEWID || '';
      this.gridCtcCode = this.data.contract_CtcCode || 0;
      console.log(this.ctcCode);
    }
  }

  
  onImageLoad(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
  
    if (imgElement && imgElement.naturalWidth && imgElement.naturalHeight) {
      this.imageWidth = imgElement.naturalWidth > 792 ? imgElement.naturalWidth : 792; // Ensure a minimum width of 492
      this.imageHeight = imgElement.naturalHeight > 492 ? imgElement.naturalHeight : 492; // Ensure a minimum height of 492
    }
  }

  

 clearValidation(field: string) {
  if ((this as any)[field]?.trim() !== '') {
    this.errors[field] = null;
  }
}

// onSkip(){

//   const formData = {
//     Id: this.id,
//     InvoiceAmount: this.InvoiceAmount,
//     PaidAmount: this.paidAmount,
//     InvoiceNumber: this.invoiceNumber,
//     SelfBillInvoiceNumber: this.selfbillinvoice,
//     InvoiceDate: this.invoiceDate,
//     DueDate: this.duedate,
//     IsSkip:true
//   };
 

//   const apiUrl = environment.API_BASE_URL+'OCRAI/ValidateRemittanceInvoice';
//     this.http.post<any>(apiUrl, formData).subscribe({
//       next: (response) => {
//         if(response.data.resultTable.length >0){
          
//           this.fetchNextRecord(response.data.resultTable[0]);
//         }
//       },
//       error: (error) => {
//         this.notificationService.showNotification(
//           'Unable to complete the skip action. Please retry.',
//           'ERROR',
//           'error',
//           () => {
//             console.log('OK clicked error'); // Callback logic
//           }
//         );
//       },
//     });
// }

onSkip() {
  this.loading = true;
  const errors: any = {};
  this.errors = errors; // Assign errors to the class property
  const formData = {
    Id: this.id,
    InvoiceAmount: this.InvoiceAmount,
    PaidAmount: this.paidAmount,
    InvoiceNumber: this.invoiceNumber,
    SelfBillInvoiceNumber: this.selfbillinvoice,
    InvoiceDate: this.invoiceDate,
    DueDate: this.duedate,
    IsSkip: true,
  };

  const apiUrl = environment.API_BASE_URL + 'OCRAI/ValidateRemittanceInvoice';
  this.http.post<any>(apiUrl, formData).subscribe({
    next: (response) => {
      this.loading = false;
      if (response.data.resultTable.length > 0) {
        const nextRecord = response.data.resultTable[0];

        // Check if this is a special message indicating completion
        if (nextRecord.Message === 'All rows complete') {
          this.notificationService.showNotification(
            'All records have been processed.',
            'INFORMATION',
            'info',
            () => {
              console.log('OK clicked all complete'); // Callback logic
              this.dialogRef.close();
            }
          );
        } else {
          this.fetchNextRecord(nextRecord);
        }
      } else {
        // Handle unexpected empty result case
        this.loading = false;
        this.notificationService.showNotification(
          'No more records to process.',
          'INFO',
          'info',
          () => {

            
              this.dialogRef.close();
          
            console.log('OK clicked no records'); // Callback logic
          }
        );
      }
    },
    error: (error) => {
      this.notificationService.showNotification(
        'Unable to complete the skip action. Please retry.',
        'ERROR',
        'error',
        () => {
          console.log('OK clicked error'); // Callback logic
        }
      );
    },
  });
}



onSubmit(form: any): void {
  this.submitted = true; // Mark the form as submitted
  let isValid = true;
  const errors: any = {};

  
  

  if (!this.paidAmount || this.paidAmount.trim() === '') {
    errors.paidAmount = 'paid Amount is required.';
    isValid = false;
  }

  if (!this.InvoiceAmount || this.InvoiceAmount.trim() === '') {
    errors.InvoiceAmount = 'Invoice Amount is required.';
    isValid = false;
  }

  
  this.errors = errors;
  

  if (isValid) {
    const formData = {
      Id: this.id,
      InvoiceAmount: this.InvoiceAmount,
      PaidAmount: this.paidAmount,
      InvoiceNumber: this.invoiceNumber,
      SelfBillInvoiceNumber: this.selfbillinvoice,
      InvoiceDate: this.invoiceDate,
      DueDate: this.duedate,
      IsSkip: false,
    };
  
    console.log('formData:', formData);
  
    const apiUrl = environment.API_BASE_URL + 'OCRAI/ValidateRemittanceInvoice';
    this.http.post<any>(apiUrl, formData).subscribe({
      next: (response) => {
        if (response.data.validationResult === 1) {
          //Success case
          this.notificationService.showNotification(
            'The records have been successfully validated.',
            'INFORMATION',
            'success',
            () => {
              if (response.data.resultTable.length > 0) {
                this.fetchNextRecord(response.data.resultTable[0]);
              }
            }
          );
          
        } else {
          
          this.notificationService.showNotification(
            'Error occurred during validation.',
            'ERROR',
            'error',
            () => {
              console.log('OK clicked - Validation error');
              console.log('response:', response);
            }
          );
        }
      },
      error: (error) => {
        // API Error handling
        this.notificationService.showNotification(
          'There was an error submitting the form. Please try again.',
          'ERROR',
          'error',
          () => {
            console.log('OK clicked - API error');
            console.error('API Error:', error);
          }
        );
      },
    });
  }
}

fetchNextRecord(data: any): void {
  console.log('fetchNextRecord');
  console.log(data);
  this.id = data.ID;
  this.contractorname ='';
  this.contractorname = data.ContractorName || '';
  this.currencytype = data.CurrencyType || '';
  this.invoiceNumber = data.InvoiceNumber || '';
  this.selfbillinvoice = data.SelfBillInvoiceNo || '';
  this.duedate = data.DueDate || '';
  this.paidAmount = data.PaidAmount.includes(' ') ? data.PaidAmount.split(' ')[0] : data.PaidAmount.trim();
  this.InvoiceAmount = data.InvoiceAmount || '';
  this.invoiceDate = data.InvoiceDate || '';
  this.gridCtcCode = data.contract_CtcCode || 0;
  this.imageName = data.PDF_Image_FileName;
  this.uplodedPDFFile =data.PDF_FileName;
  this.setImagePath(this.imageName, this.uplodedPDFFile);
  this.IsContractIsActiveOrNot = data.ErrorMessage;
  
}


  submitForm(): void {
    if (this.myForm) {
      this.myForm.ngSubmit.emit();
    }
  }


  isModalOpen = true; // Controls modal visibility

  closeDialog(): void {
    this.dialogRef.close();
  }

  downloadPdfFile(data: any) {
    console.log(data);
    const fileUrl = environment.API_BASE_URL +`assets/documents/processed-pdf/${data.InvoiceFileName}`;; // Replace with your API endpoint

    this.downloadPdfService.downloadPdf(fileUrl).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'file.pdf'; 
      link.click();
      window.URL.revokeObjectURL(url); 
    });
  }

  getToday(): string {
    return new Date().toISOString().split('T')[0]
 }
}
