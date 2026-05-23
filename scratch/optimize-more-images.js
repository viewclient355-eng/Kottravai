const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = 'c:\\Users\\HARIKRISHNAN\\Downloads\\Kottravai-main\\Kottravai-main\\public';

const imagesToOptimize = [
    {
        input: 'hampers.jpg',
        output: 'hampers.webp',
        maxWidth: 600, // It's only displayed in cards / rows, no need for huge width
        quality: 80
    },
    {
        input: 'Ach.jpeg',
        output: 'Ach.webp',
        maxWidth: 800, // Blog thumbnail
        quality: 80
    },
    {
        input: 'harish.jpeg',
        output: 'harish.webp',
        maxWidth: 150, // Small testimonial avatar
        quality: 80
    },
    {
        input: 'Aarthi.jpeg',
        output: 'Aarthi.webp',
        maxWidth: 150, // Small testimonial avatar
        quality: 80
    }
];

async function run() {
    console.log('Starting more image optimizations...');
    for (const item of imagesToOptimize) {
        const inputPath = path.join(publicDir, item.input);
        const outputPath = path.join(publicDir, item.output);
        
        if (!fs.existsSync(inputPath)) {
            console.error(`Input file does not exist: ${inputPath}`);
            continue;
        }

        try {
            console.log(`Optimizing ${item.input} -> ${item.output}...`);
            const metadata = await sharp(inputPath).metadata();
            
            let pipeline = sharp(inputPath);
            if (metadata.width > item.maxWidth) {
                console.log(`  Resizing from ${metadata.width}px to ${item.maxWidth}px width`);
                pipeline = pipeline.resize({ width: item.maxWidth });
            }
            
            await pipeline
                .webp({ quality: item.quality })
                .toFile(outputPath);
                
            const oldSize = fs.statSync(inputPath).size;
            const newSize = fs.statSync(outputPath).size;
            const savings = ((oldSize - newSize) / oldSize * 100).toFixed(1);
            
            console.log(`  Done! Size reduced from ${(oldSize/1024).toFixed(1)} KB to ${(newSize/1024).toFixed(1)} KB (Saved ${savings}%)`);
        } catch (err) {
            console.error(`Error processing ${item.input}:`, err.message);
        }
    }
    console.log('More image optimizations completed!');
}

run();
