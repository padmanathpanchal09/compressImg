import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import Pica from 'pica';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,RouterLink,ReactiveFormsModule,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'compressImg';

  imageForm: FormGroup;
  selectedFile: File | null = null;
  selectedFilePreview: string | ArrayBuffer | null = null;
  uploadProgress: number = 0;
  uploadSpeed: string = '0 B/s';
  isCompressionComplete: boolean = false;
  compressedFileSize: number = 0;
  compressedImage: string | ArrayBuffer | null = null;
  uploadSubscription: Subscription | null = null;
  private compressionInterval: any;

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
        if (this.selectedFile) {
          this.compressImage(this.selectedFile);
        }
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

    console.log('Compression cancelled');
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
      a.href = typeof this.compressedImage === 'string' ? this.compressedImage : URL.createObjectURL(new Blob([this.compressedImage]));
      a.download = 'compressed_image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (typeof this.compressedImage !== 'string') {
        URL.revokeObjectURL(a.href);
      }
    }
  }

  // Update compressImage method
  compressImage(file: File) {
    const pica = new Pica();
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target) {
        img.src = e.target.result as string;
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to read file:', error);
      return; // Exit the function if reading fails
    }

    img.onload = () => {
      try {
        // Set canvas dimensions for the desired output size
        canvas.width = img.width * 0.6; // Adjust the scale as needed
        canvas.height = img.height * 0.6; // Adjust the scale as needed

        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
          console.error('Canvas context is null');
          return; // Exit the function if ctx is null
        }

        // Use Pica to resize the image
        pica.resize(canvas, canvas)
          .then(result => pica.toBlob(result, 'image/jpeg', 0.8)) // Adjust quality as needed
          .then(blob => {
            const url = URL.createObjectURL(blob);
            this.compressedImage = url; // Set the compressed image URL
          })
          .catch(err => {
            console.error('Error during image resizing:', err);
          });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    };

    img.onerror = (error) => {
      console.error('Error loading image:', error);
    };
  }
  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files ? target.files[0] : null;
    if (file) {
      this.compressImage(file); // Call the merged compressImage function
    } else {
      console.error('No file selected.');
    }
  }
}
