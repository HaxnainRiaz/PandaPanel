const Product = require('../models/Product');
const Category = require('../models/Category');
const Banner = require('../models/Banner');
const Settings = require('../models/Settings');
const cache = require('../utils/memoryCache');

const PRODUCT_LIST_FIELDS = 'title slug images price salePrice stock category isFeatured isBestSeller status rating totalReviews createdAt';
const CATALOG_CACHE_KEY = 'store:catalog:v1';
const CATALOG_TTL = 120;

const trimProductImages = (product) => ({
    ...product,
    images: Array.isArray(product.images) ? product.images.slice(0, 1) : product.images
});

exports.getStoreCatalog = async (req, res) => {
    try {
        const cached = cache.get(CATALOG_CACHE_KEY);
        if (cached) {
            res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
            res.set('X-Cache', 'HIT');
            return res.status(200).json(cached);
        }

        const productLimit = Math.min(parseInt(req.query.productLimit, 10) || 100, 100);

        const [products, categories, banners, settingsDoc] = await Promise.all([
            Product.find({ status: 'active' })
                .select(PRODUCT_LIST_FIELDS)
                .populate('category', 'title slug')
                .sort({ createdAt: -1 })
                .limit(productLimit)
                .lean(),
            Category.find()
                .select('title slug image description')
                .sort({ title: 1 })
                .lean(),
            Banner.find()
                .select('title subtitle image link buttonText isActive order')
                .sort({ order: 1 })
                .lean(),
            Settings.findOne().select('-__v').lean()
        ]);

        const payload = {
            success: true,
            data: {
                products: products.map(trimProductImages),
                categories,
                banners,
                settings: settingsDoc || {
                    announcementBarText: 'Free Delivery on Orders Over Rs. 4,999!',
                    showNewsletterSection: true,
                    showFeaturedCollection: true
                }
            }
        };

        cache.set(CATALOG_CACHE_KEY, payload, CATALOG_TTL);

        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        res.set('X-Cache', 'MISS');
        res.status(200).json(payload);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.invalidateStoreCatalogCache = () => {
    cache.del(CATALOG_CACHE_KEY);
    cache.delByPrefix('products:list:');
};
