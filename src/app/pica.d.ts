// src/pica.d.ts
declare module 'pica' {
    export default class Pica {
        constructor();
        resize(from: HTMLCanvasElement, to: HTMLCanvasElement, options?: any): Promise<HTMLCanvasElement>;
        toBlob(canvas: HTMLCanvasElement, mimeType?: string, quality?: number): Promise<Blob>;
    }
}