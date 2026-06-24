export const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('image', file);

        let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && apiUrl.includes('localhost')) {
            apiUrl = 'https://store-backend-neon.vercel.app';
        }
        // Clean up base URL for the upload request
        const baseApiUrl = apiUrl.replace(/\/$/, '').replace(/\/api$/, '');

        const response = await fetch(`${baseApiUrl}/api/upload`, {
            method: 'POST',
            body: formData,
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error(`Server returned ${response.status}. Check backend logs.`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Upload failed');
        }

        return data.url;
    } catch (error) {
        console.error('Upload failed:', error);
        throw new Error(`Image upload failed: ${error.message}`);
    }
};

export const validateImageFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Only JPG, PNG, WEBP, and GIF images are allowed' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'Image size must be less than 5MB' };
    }

    return { valid: true, error: null };
};

/**
 * 🖼️ Dynamic Image Resolver for Admin Dashboard
 */
export function resolveImageUrl(src, placeholder = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1200") {
    if (!src || typeof src !== 'string') return placeholder;

    let imageUrl = src;

    // 1. Handle remote URLs
    if (imageUrl.startsWith('http')) {
        // Handle legacy localhost URLs in the production database
        if (process.env.NODE_ENV === 'production' && imageUrl.includes('localhost:5000')) {
            return imageUrl.replace(/https?:\/\/localhost:5000/, process.env.NEXT_PUBLIC_API_URL || 'https://store-backend-neon.vercel.app');
        }
        return imageUrl;
    }

    // 2. Handle relative paths from backend
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && baseUrl.includes('localhost')) {
        baseUrl = 'https://store-backend-neon.vercel.app';
    }
    baseUrl = baseUrl.replace(/\/$/, '').replace(/\/api$/, '');

    // Clean up the path: remove leading slash and 'uploads/' prefix if present
    const cleanPath = imageUrl.replace(/^\//, '').replace(/^uploads\//, '');

    return `${baseUrl}/uploads/${cleanPath}`;
}

