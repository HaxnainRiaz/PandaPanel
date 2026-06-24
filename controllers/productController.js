const socketUtil = require('../utils/socket');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const { createLog } = require('./auditController');
const cache = require('../utils/memoryCache');
const { invalidateStoreCatalogCache } = require('./storeCatalogController');

const PRODUCT_LIST_FIELDS = 'title slug images price salePrice stock category isFeatured isBestSeller status rating totalReviews createdAt';
const PRODUCT_DETAIL_FIELDS = 'title slug description ingredients usage images price salePrice stock category tags concerns isFeatured isBestSeller status rating totalReviews metaTitle metaDescription createdAt updatedAt';

const trimProductImages = (product) => ({
    ...product,
    images: Array.isArray(product.images) ? product.images.slice(0, 1) : product.images
});

const buildPublicListFilter = (query) => {
    const filter = { status: 'active' };
    if (query.featured === 'true') filter.isFeatured = true;
    if (query.bestseller === 'true') filter.isBestSeller = true;
    if (query.category && mongoose.Types.ObjectId.isValid(query.category)) {
        filter.category = query.category;
    }
    if (query.search) {
        const term = String(query.search).trim();
        if (term) {
            filter.$or = [
                { title: { $regex: term, $options: 'i' } },
                { slug: { $regex: term, $options: 'i' } }
            ];
        }
    }
    return filter;
};

const clearProductCaches = () => {
    invalidateStoreCatalogCache();
};

exports.getProducts = async (req, res) => {
    try {
        let isAdmin = false;
        if (req.headers.authorization?.startsWith('Bearer ') && process.env.JWT_SECRET) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
                isAdmin = decoded.role === 'admin';
            } catch (_) { /* public request */ }
        }

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 20, 1),
            isAdmin ? 500 : 100
        );
        const skip = (page - 1) * limit;
        const filter = isAdmin ? {} : buildPublicListFilter(req.query);
        const cacheKey = isAdmin ? null : `products:list:${JSON.stringify({ filter, page, limit })}`;

        if (cacheKey) {
            const cached = cache.get(cacheKey);
            if (cached) {
                res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
                res.set('X-Cache', 'HIT');
                return res.status(200).json(cached);
            }
        }

        const [total, products] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter)
                .select(isAdmin ? undefined : PRODUCT_LIST_FIELDS)
                .populate('category', 'title slug')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        const payload = {
            success: true,
            total,
            data: isAdmin ? products : products.map(trimProductImages),
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit) || 1,
                limit
            }
        };

        if (!isAdmin) {
            cache.set(cacheKey, payload, 60);
            res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
            res.set('X-Cache', 'MISS');
        }

        res.status(200).json(payload);
    } catch (err) {
        console.error('getProducts error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getProductBySlug = async (req, res) => {
    try {
        const slug = String(req.params.slug || '').trim();
        if (!slug) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const cacheKey = `products:slug:${slug}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
            res.set('X-Cache', 'HIT');
            return res.status(200).json(cached);
        }

        const product = await Product.findOne({ slug, status: 'active' })
            .select(PRODUCT_DETAIL_FIELDS)
            .populate('category', 'title slug')
            .lean();

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const payload = { success: true, data: product };
        cache.set(cacheKey, payload, 60);

        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        res.set('X-Cache', 'MISS');
        res.status(200).json(payload);
    } catch (err) {
        console.error('getProductBySlug error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = await Product.findById(req.params.id)
            .populate('category', 'title slug')
            .lean();

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, data: product });
    } catch (err) {
        console.error('getProduct error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        if (req.body.isBestseller !== undefined) req.body.isBestSeller = req.body.isBestseller;
        if (req.body.isBestSeller === undefined && req.body.isBestseller !== undefined) {
            req.body.isBestSeller = req.body.isBestseller;
        }

        if (req.body.seo) {
            req.body.metaTitle = req.body.seo.metaTitle || '';
            req.body.metaDescription = req.body.seo.metaDescription || '';
        }

        if (req.body.howToUse !== undefined) req.body.usage = req.body.howToUse;

        if (req.body.visibilityStatus) {
            req.body.status = req.body.visibilityStatus === 'published' ? 'active' : 'inactive';
        }

        if (req.body.category) {
            const cats = Array.isArray(req.body.category) ? req.body.category : [req.body.category];
            const validIds = [];

            for (const c of cats) {
                if (mongoose.Types.ObjectId.isValid(c)) {
                    validIds.push(c);
                } else if (typeof c === 'string') {
                    const categoryDoc = await Category.findOne({
                        title: { $regex: new RegExp(`^${c}$`, 'i') }
                    }).select('_id').lean();
                    if (categoryDoc) validIds.push(categoryDoc._id);
                }
            }
            req.body.category = validIds;
        }

        let product = await Product.create(req.body);
        product = await product.populate('category');

        clearProductCaches();
        await createLog(req.user.id, 'Product Creation', `Created product: ${product.title} (${product.slug})`);

        try {
            socketUtil.getIO().emit('product:create', product);
        } catch (e) { console.error('Socket Emit Error:', e); }

        res.status(201).json({ success: true, data: product });
    } catch (err) {
        console.error('Create Product Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (req.body.isBestseller !== undefined) req.body.isBestSeller = req.body.isBestseller;
        if (req.body.seo) {
            req.body.metaTitle = req.body.seo.metaTitle || '';
            req.body.metaDescription = req.body.seo.metaDescription || '';
        }
        if (req.body.howToUse !== undefined) req.body.usage = req.body.howToUse;
        if (req.body.visibilityStatus) {
            req.body.status = req.body.visibilityStatus === 'published' ? 'active' : 'inactive';
        }

        if (req.body.category) {
            const cats = Array.isArray(req.body.category) ? req.body.category : [req.body.category];
            const validIds = [];

            for (const c of cats) {
                if (mongoose.Types.ObjectId.isValid(c)) {
                    validIds.push(c);
                } else if (typeof c === 'string') {
                    const categoryDoc = await Category.findOne({
                        title: { $regex: new RegExp(`^${c}$`, 'i') }
                    }).select('_id').lean();
                    if (categoryDoc) validIds.push(categoryDoc._id);
                }
            }
            req.body.category = validIds;
        }

        const existing = await Product.findById(req.params.id).select('_id slug').lean();
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('category');

        clearProductCaches();
        cache.del(`products:slug:${existing.slug}`);
        if (product.slug !== existing.slug) cache.del(`products:slug:${product.slug}`);

        await createLog(req.user.id, 'Product Update', `Updated product: ${product.title}`);

        try {
            socketUtil.getIO().emit('product:update', product);
        } catch (e) { console.error('Socket Emit Error:', e); }

        res.status(200).json({ success: true, data: product });
    } catch (err) {
        console.error('Update Product Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const productTitle = product.title;
        const slug = product.slug;
        await product.deleteOne();

        clearProductCaches();
        cache.del(`products:slug:${slug}`);

        await createLog(req.user.id, 'Product Deletion', `Deleted product: ${productTitle}`);

        try {
            socketUtil.getIO().emit('product:delete', { id: req.params.id });
        } catch (e) { console.error('Socket Emit Error:', e); }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
