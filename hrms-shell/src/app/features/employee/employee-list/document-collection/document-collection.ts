import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MATERIAL } from '../../../../shared/material/materials';
import { CommonModule } from '@angular/common';
import { ApiClient } from '../../../../core/services/api-client.service';
import { API_ENDPOINTS } from '../../../../core/config/api-endpoints';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../../environments/environement';
import { UploadDocDialog, FileUploadDialogData } from '../../../../shared/dialogs/upload-doc-dialog/upload-doc-dialog';
export interface DocItem {
  key: string;          // Unique ID
  name: string;         // Display Name (e.g. PAN Card)
  required: boolean;

  // Data (Null if not uploaded yet)
  uploadedFile?: File | null;
  previewUrl?: string | null;
  docNumber?: string | null;
  fileName?: string | null;
}

@Component({
  selector: 'app-document-collection',
  imports: [MATERIAL, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './document-collection.html',
  styleUrl: './document-collection.scss',
})
export class DocumentCollection implements OnInit {
  private dialog = inject(MatDialog);
  private _httpClient = inject(ApiClient);
  private destroyRef = inject(DestroyRef);
  private _route = inject(ActivatedRoute);

  documents: any = signal([]);

  docTypes = signal<{ docType: string; docName: string }[]>([
    { docType: 'EXPERIENCE_CERTIFICATE', docName: 'Experience Certificate' },
    { docType: 'RELIEVING_LETTER', docName: 'Relieving Letter' },
    { docType: 'PAY_SLIPS', docName: 'Pay Slips' },
    { docType: 'OFFER_LETTER', docName: 'Offer Letter' },
    { docType: 'EDUCATION_CERTIFICATE', docName: 'Education Certificate' },
    { docType: 'AADHAR_CARD', docName: 'Aadhar Card' },
    { docType: 'PAN_CARD', docName: 'PAN Card' },
    { docType: 'OTHER', docName: 'Other' }
  ]);

  selectedDocType = signal<string>('');
  id!: string;
  destroy$ = new Subject<void>();
  ngOnInit(): void {
    this.id = this._route.snapshot.paramMap.get('id')!;
    if (this.id) {
      this.getDocuments();
    }
  }
  // Handle "Add Other Document"
  addNewDocument() {
    this.openCustomDocDialog(this.selectedDocType());
  }

  // Handle Edit/Upload Click
  onCardClick(doc: DocItem, index: number) {
    this.openCustomDocDialog(doc); // Pass full doc object for editing
  }

  // Open Dialog to Add Custom Doc
  openCustomDocDialog(docOrType?: any) {
    const isEditing = docOrType && typeof docOrType !== 'string';
    const defaultName = isEditing ? docOrType.name : (docOrType || '');
    const defaultId = isEditing ? docOrType.docNumber : '';
    const dialogConfig: FileUploadDialogData = {
      title: isEditing ? 'Edit Document' : 'Upload Document',
      accept: '.jpg,.jpeg,.png,.pdf',
      documentType: isEditing ? null : docOrType,
      fields: [
        { key: 'docName', label: 'Name', type: 'text', required: true, value: defaultName, placeholder: 'e.g. Relieving Letter' },
        { key: 'docId', label: 'Document Number', type: 'text', required: true, value: defaultId, placeholder: 'e.g. 1234567890' },
        { key: 'dob', label: 'Date of Birth', type: 'date', required: false, placeholder: 'e.g. 12/12/2020' },
        { key: 'issueDate', label: 'Issue Date', type: 'date', required: false, placeholder: 'e.g. 12/12/2020' },
        { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: false, placeholder: 'e.g. 12/12/2020' },
      ]
    };
    const dialogRef = this.dialog.open(UploadDocDialog, {
      width: '70vw',
      height: '80vh',
      maxWidth: '70vw',
      maxHeight: '80vh',
      panelClass: 'full-screen-dialog', // Using a specific class for full screen
      data: dialogConfig
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Form Data:', result.formData);
        console.log('File Obj:', result.file);
        this.updateDocumentList(result);
      }
    });
  }


  updateDocumentList(result: any) {
    // Construct FormData
    const formData = new FormData();
    formData.append('employee_uuid', this.id);
    formData.append('file', result.file);
    formData.append('documentType', this.selectedDocType() || 'OTHER');
    formData.append('formValues', JSON.stringify({
      docName: result.formData.docName,
      docId: result.formData.docId,
      dob: result.formData.dob,
      issueDate: result.formData.issueDate,
      expiryDate: result.formData.expiryDate
    }));

    // Call API
    this._httpClient.post(API_ENDPOINTS.employee.uploadDocument, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.getDocuments();
      },
      error: (err) => {
        console.error('Upload failed', err);
        // Handle error (e.g. show toast)
      }
    });
  }

  isImage(url: string | null | undefined): boolean {
    return url ? url.startsWith('data:image') || url.match(/\.(jpeg|jpg|png)$/) != null : false;
  }

  isExpired(dateInput: string | Date | undefined | null): boolean {
    if (!dateInput) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(dateInput);
    return !isNaN(expiryDate.getTime()) && expiryDate < today;
  }

  getDocuments(document_type?: any) {
    let payload: any = {
      employee_uuid: this.id,
    }
    if (document_type) {
      payload['documentType'] = [document_type]

    }
    this._httpClient.post(API_ENDPOINTS.employee.getDocuments, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (_res: any) => {
        if (_res?.data) {
          const mappedDocs = _res.data.map((doc: any) => ({
            key: doc._id,
            name: doc.form_values?.docName || doc.document_type,
            docNumber: doc.form_values?.docId,
            dob: doc.form_values?.dob,
            issueDate: doc.form_values?.issueDate,
            expiryDate: doc.form_values?.expiryDate,
            uploadedFile: doc.file_id ? { name: doc.document_type } : null,
            fileName: doc.document_type,
            previewUrl: doc.file_id ? `${environment.apiUrl}/common/get_image/${doc.file_id}` : null
          }));
          console.log(mappedDocs);
          this.documents.set(mappedDocs);
        }
      },
      error: (err) => {
        console.error('Error fetching documents', err);
      }
    });
  }
}
