import { getApiBaseUrl } from '@/lib/apiConfig';

const PLACEHOLDER = 'https://placehold.co/160x160?text=No+Image';
const MAX_SIZE = 10 * 1024 * 1024;

export const uploadImage = async (file, onProgress) => {
    try {
        const formData = new FormData();
        formData.append('image', file);

        onProgress?.(10);

        const response = await fetch(`${getApiBaseUrl()}/api/upload`, {
            method: 'POST',
            body: formData,
        });

        onProgress?.(70);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error(`Server returned ${response.status}. Check backend logs.`);
        }

        const data = await response.json();

        if (!data.success) {
            if (data.code === 'IMAGE_STORAGE_NOT_CONFIGURED') {
                throw new Error('Image storage is not configured on the server. Add Cloudinary environment variables in Vercel backend settings and redeploy.');
            }
            throw new Error(data.details || data.message || 'Upload failed');
        }

        onProgress?.(100);

        return data.data?.image || data.data?.url || data.url;
    } catch (error) {
        console.error('Upload failed:', error);
        throw new Error(error.message || 'Image upload failed');
    }
};

export const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Only JPG, PNG, WEBP, and AVIF images are allowed' };
    }

    if (file.size > MAX_SIZE) {
        return { valid: false, error: 'Image size must be less than 10MB' };
    }

    return { valid: true, error: null };
};

export function pickImageUrl(image, variant = 'thumb', placeholder = PLACEHOLDER) {
    if (!image) return placeholder;

    if (typeof image === 'string') {
        return resolveImageUrl(image, placeholder);
    }

    if (image.variants?.[variant]) {
        return image.variants[variant];
    }

    const fallbackOrder = ['thumb', 'small', 'medium', 'large'];
    for (const key of fallbackOrder) {
        if (image.variants?.[key]) return image.variants[key];
    }

    if (image.originalUrl) return image.originalUrl;
    if (image.url) return image.url;

    return placeholder;
}

/**
 * Dynamic image resolver for admin dashboard
 */
export function resolveImageUrl(src, placeholder = PLACEHOLDER) {
    if (!src) return placeholder;

    if (typeof src === 'object') {
        return pickImageUrl(src, 'thumb', placeholder);
    }

    if (typeof src !== 'string') return placeholder;

    let imageUrl = src;

    if (imageUrl.startsWith('http')) {
        if (process.env.NODE_ENV === 'production' && imageUrl.includes('localhost:5000')) {
            return imageUrl.replace(/https?:\/\/localhost:5000/, getApiBaseUrl());
        }
        return imageUrl;
    }

    const cleanPath = imageUrl.replace(/^\//, '').replace(/^uploads\//, '');
    return `${getApiBaseUrl()}/uploads/${cleanPath}`;
}
