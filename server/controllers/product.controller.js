import Product from '../models/Product.model.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @GET /api/products — public with filters + pagination
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    search,
    minPrice,
    maxPrice,
    sort = '-createdAt',
    featured,
  } = req.query;

  const { wholesale } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (featured === 'true') filter.isFeatured = true;
  if (wholesale === 'true') filter.isWholesaleAvailable = true;
  if (search) filter.$text = { $search: search };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter).sort(sort).skip(skip).limit(Number(limit));

  res.json({
    success: true,
    products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// @GET /api/products/:id — public
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

// @POST /api/products — admin only
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

// @PUT /api/products/:id — admin only
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

// @DELETE /api/products/:id — admin only (soft delete)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, message: 'Product deleted successfully' });
});

// @POST /api/products/upload — admin only
export const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('Please upload at least one image');
  }
  const imageUrls = req.files.map((file) => file.path);
  res.json({ success: true, images: imageUrls });
});
