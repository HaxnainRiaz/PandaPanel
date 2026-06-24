export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export function formatPrice(price) {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price || 0);
}

export function formatCompactPrice(price) {
    if (price === 0) return 'PKR 0.00';

    const formatter = new Intl.NumberFormat('en-PK', {
        notation: 'compact',
        compactDisplay: 'short',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return 'PKR ' + formatter.format(price);
}
