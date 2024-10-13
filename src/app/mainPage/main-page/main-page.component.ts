import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import Pica from 'pica';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [RouterOutlet,RouterLink,ReactiveFormsModule,CommonModule],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent {

    title = 'compressImg';
  
    imageForm: FormGroup;
    selectedFile: File | null = null;
    selectedFilePreview: string | ArrayBuffer | null = null;
    uploadProgress: number = 0;
    uploadSpeed: string = '0 B/s';
    isCompressionComplete: boolean = false;
    compressedFileSize: number = 0;
    compressedImage: string | null = null;
    uploadSubscription: Subscription | null = null;
    private compressionInterval: any;
    minCompressedSize: number = 1024;
  
    constructor(private formBuilder: FormBuilder) {
      this.imageForm = this.formBuilder.group({
      });
    }
  
    ngOnInit(): void {
    }
  
    onFileChange(event: Event): void {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        this.selectedFile = input.files[0];
        this.createFilePreview();
        this.startCompression(); 
      }
    }
  
    createFilePreview(): void {
      if (this.selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.selectedFilePreview = e.target?.result as string;
        };
        reader.readAsDataURL(this.selectedFile);
      }
    }
  
    startCompression(): void {
      this.uploadProgress = 0;
      this.uploadSpeed = '0 B/s';
      this.isCompressionComplete = false;
      this.compressedFileSize = 0;
      this.compressedImage = null;
  
      let progress = 0;
      this.compressionInterval = setInterval(() => {
        progress += 10;
        this.uploadProgress = progress;
        this.uploadSpeed = `${Math.floor(Math.random() * 1000)} B/s`;
        if (progress >= 100) {
          clearInterval(this.compressionInterval);
          this.compressionInterval = null;
          this.compressImage();
        }
      }, 500);
    }
  
    onSubmit(): void {

    }
  
  
    getFileSizeInMB(bytes: number): string {
      return (bytes / (1024 * 1024)).toFixed(2);
    }
  
    getFileSizeInKB(bytes: number): string {
      return (bytes / 1024).toFixed(2);
    }
  
    cancelCompression(): void {
      if (this.compressionInterval) {
        clearInterval(this.compressionInterval);
        this.compressionInterval = null;
      }
  
      if (this.uploadSubscription) {
        this.uploadSubscription.unsubscribe();
        this.uploadSubscription = null;
      }
  
      this.uploadProgress = 0;
      this.uploadSpeed = '0 B/s';
      this.isCompressionComplete = false;
      this.compressedFileSize = 0;
      this.compressedImage = null;
      this.selectedFile = null;
      this.selectedFilePreview = null;
    }
  
    downloadOriginalImage(): void {
      if (this.selectedFile) {
        const url = URL.createObjectURL(this.selectedFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.selectedFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  
    downloadCompressedImage(): void {
      if (this.compressedImage) {
        const a = document.createElement('a');
        a.href = this.compressedImage; 
        a.download = `compressed_${this.selectedFile?.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  
    compressImage(): void {
        const img = new Image();
        img.src = this.selectedFilePreview as string; 
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const pica = new Pica();
            const MAX_WIDTH = 800; 
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            if (ctx && this.selectedFile) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const originalSize = this.selectedFile.size; 
                let quality = 0.9; 

                const compress = (quality: number) => {
                    pica.resize(canvas, canvas, {
                        quality: 3,
                    }).then(result => {
                        return pica.toBlob(result, 'image/jpeg', quality);
                    }).then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            this.compressedImage = reader.result as string; 
                            this.compressedFileSize = blob.size; 

                            if (this.compressedFileSize >= originalSize && quality > 0.1) {
                                quality -= 0.1; 
                                compress(quality);
                            } else if (this.compressedFileSize < this.minCompressedSize && quality > 0.1) {
                                quality -= 0.1; 
                                compress(quality); 
                            } else {
                                if (this.compressedFileSize < this.minCompressedSize) {
                                    console.warn('Final compressed image is below minimum size. Adjusting quality.');
                                    quality = 0.1; 
                                    compress(quality);
                                } else {
                        
                                    if (quality < 0.5) {
                                        console.warn('Quality of the image is low. Consider increasing quality.');
                                    }
                                    this.isCompressionComplete = true;
                                    this.uploadProgress = 100;
                                    this.uploadSpeed = '0 B/s';
                                }
                            }
                        };
                        reader.readAsDataURL(blob);
                    });
                };

                compress(quality); 
            }
        };
    }
  
    onDragOver(event: DragEvent): void {
      event.preventDefault(); 
    }
  

    onDrop(event: DragEvent): void {
      event.preventDefault(); 
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        this.selectedFile = files[0];
        this.createFilePreview();
        this.startCompression();
      }
    }
  }
