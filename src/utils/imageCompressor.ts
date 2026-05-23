import imageCompression from 'browser-image-compression';

export interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    savedPercentage: string;
}

export const compressImage = async (file: File): Promise<CompressionResult> => {
    const options = {
        maxSizeMB: 0.3,          // Max 300KB
        maxWidthOrHeight: 1200,   // Max 1200px
        useWebWorker: true,       // Non-blocking
        fileType: 'image/webp',   // Convert to WebP
        initialQuality: 0.8,      // 80% quality
    };

    try {
        const originalSize = file.size;
        console.log(`Original: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
        
        const compressed = await imageCompression(file, options);
        const compressedSize = compressed.size;
        console.log(`Compressed: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
        
        const savedPercentage = (((originalSize - compressedSize) / originalSize) * 100).toFixed(0);

        // Return as File with .webp extension
        const compressedFile = new File(
            [compressed],
            file.name.replace(/\.[^.]+$/, '.webp'),
            { type: 'image/webp' }
        );

        return {
            file: compressedFile,
            originalSize,
            compressedSize,
            savedPercentage
        };
    } catch (err) {
        console.error('Compression failed:', err);
        return {
            file: file,
            originalSize: file.size,
            compressedSize: file.size,
            savedPercentage: '0'
        };
    }
};
