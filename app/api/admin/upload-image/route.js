import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
    console.log('Upload API called');
    try {
        const formData = await request.formData();
        const file = formData.get('image');

        if (!file) {
            console.error('No file received');
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        console.log(`Receiving file: ${file.name}, size: ${file.size}, type: ${file.type}`);

        // Validate file type
        if (!file.type.startsWith('image/')) {
            console.error('Invalid file type:', file.type);
            return NextResponse.json(
                { success: false, message: 'File must be an image' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            console.error('File too large:', file.size);
            return NextResponse.json(
                { success: false, message: 'Image size must be less than 5MB' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const fileExt = path.extname(file.name) || '.jpg';
        const fileName = `${uuidv4()}${fileExt}`;

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        console.log('Upload directory:', uploadDir);

        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
            console.log('Directory ensured');
        } catch (mkdirError) {
            console.error('Error creating directory:', mkdirError);
            // Continue, as it might already exist
        }

        const filePath = path.join(uploadDir, fileName);
        console.log('Writing to:', filePath);

        await writeFile(filePath, buffer);
        console.log('File written successfully');

        // Return the public URL
        const publicUrl = `/uploads/${fileName}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName: fileName
        });
    } catch (error) {
        console.error('Upload FATAL error:', error);
        return NextResponse.json(
            { success: false, message: `Failed to upload image: ${error.message}` },
            { status: 500 }
        );
    }
}
