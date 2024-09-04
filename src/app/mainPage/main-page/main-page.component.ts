import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import Pica from 'pica'; // Import the library

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
    minCompressedSize: number = 1024; // Set a default minimum compressed size (in bytes)
  
    constructor(private formBuilder: FormBuilder) {
      this.imageForm = this.formBuilder.group({
        // Remove compression settings from the form
      });
    }
  
    ngOnInit(): void {
    }
  
    onFileChange(event: Event): void {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        this.selectedFile = input.files[0];
        this.createFilePreview();
        this.startCompression(); // Automatically start compression after file selection
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
  
      // Simulate upload progress
      let progress = 0;
      this.compressionInterval = setInterval(() => {
        progress += 10;
        this.uploadProgress = progress;
        this.uploadSpeed = `${Math.floor(Math.random() * 1000)} B/s`; // Random speed for simulation
        if (progress >= 100) {
          clearInterval(this.compressionInterval);
          this.compressionInterval = null;
          this.compressImage();
        }
      }, 500);
    }
  
    onSubmit(): void {
      // Implement your submission logic here
    }
  
    // Remove toggleSettings method if it exists
    // Remove showSettings property if it exists
  
    getFileSizeInMB(bytes: number): string {
      return (bytes / (1024 * 1024)).toFixed(2);
    }
  
    getFileSizeInKB(bytes: number): string {
      return (bytes / 1024).toFixed(2);
    }
  
    cancelCompression(): void {
      // Clear the compression interval
      if (this.compressionInterval) {
        clearInterval(this.compressionInterval);
        this.compressionInterval = null;
      }
  
      // Cancel the upload if it's in progress
      if (this.uploadSubscription) {
        this.uploadSubscription.unsubscribe();
        this.uploadSubscription = null;
      }
  
      // Reset all relevant properties
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
        a.href = this.compressedImage; // Use the compressed image URL
        a.download = 'compressed_image.jpg'; // Name for the downloaded file
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  
    compressImage(): void {
        const img = new Image();
        img.src = this.selectedFilePreview as string; // Use the preview as the source
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const pica = new Pica();
            const MAX_WIDTH = 800; // Set max width for compression
            const scaleSize = MAX_WIDTH / img.width;

            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            if (ctx && this.selectedFile) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const originalSize = this.selectedFile.size; // Get original file size
                let quality = 0.9; // Start with high quality

                const compress = (quality: number) => {
                    pica.resize(canvas, canvas, {
                        quality: 3, // Quality setting (1-3)
                    }).then(result => {
                        return pica.toBlob(result, 'image/jpeg', quality); // Convert to Blob with adjusted quality
                    }).then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            this.compressedImage = reader.result as string; // Get the compressed image
                            this.compressedFileSize = blob.size; // Update compressed file size

                            // Check if the compressed size is greater than or equal to the original size
                            if (this.compressedFileSize >= originalSize && quality > 0.1) {
                                quality -= 0.1; // Decrease quality
                                compress(quality); // Retry compression
                            } else if (this.compressedFileSize < this.minCompressedSize && quality > 0.1) {
                                quality -= 0.1; // Decrease quality to increase size
                                compress(quality); // Retry compression
                            } else {
                                // Ensure the final compressed image is not smaller than the minimum size
                                if (this.compressedFileSize < this.minCompressedSize) {
                                    console.warn('Final compressed image is below minimum size. Adjusting quality.');
                                    quality = 0.1; // Set to minimum quality
                                    compress(quality); // Retry compression
                                } else {
                                    // Check the quality of the compressed image
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

                compress(quality); // Start compression
            }
        };
    }
  
    // New method to handle drag over event
    onDragOver(event: DragEvent): void {
      event.preventDefault(); // Prevent default to allow drop
    }
  
    // New method to handle drop event
    onDrop(event: DragEvent): void {
      event.preventDefault(); // Prevent default behavior
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        this.selectedFile = files[0];
        this.createFilePreview();
        this.startCompression(); // Automatically start compression after file selection
      }
    }
  }
