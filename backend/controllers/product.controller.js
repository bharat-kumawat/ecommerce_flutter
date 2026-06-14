import Product from "../models/product.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../middlewares/upload.middleware.js";

// @desc    Get all products with filters
// @route   GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    sort,
    category,
    brand,
    minPrice,
    maxPrice,
    rating,
    search,
  } = req.query;

  const query = { isActive: true };

  if (category) query.category = category;
  if (brand) query.brand = { $regex: brand, $options: "i" };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (rating) query.ratings = { $gte: Number(rating) };
  if (search) query.$text = { $search: search };

  const sortOptions = {
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    newest: { createdAt: -1 },
    rating: { ratings: -1 },
    popular: { sold: -1 },
  };

  const products = await Product.find(query)
    .populate("category", "name slug")
    .sort(sortOptions[sort] || { createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);

  res.json(
    new ApiResponse(200, {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }),
  );
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "category",
    "name slug",
  );

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  res.json(new ApiResponse(200, { product }));
});

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate(
    "category",
    "name slug",
  );

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  res.json(new ApiResponse(200, { product }));
});

// @desc    Get featured products
// @route   GET /api/products/featured
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate("category", "name slug")
    .limit(Number(limit));

  res.json(new ApiResponse(200, { products }));
});

// @desc    Get flash sale products
// @route   GET /api/products/flash-sale
export const getFlashSaleProducts = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1 } = req.query;
  const now = new Date();

  const products = await Product.find({
    isFlashSale: true,
    flashSaleEndTime: { $gt: now }, // Only active sales
    isActive: true,
    stock: { $gt: 0 },
  })
    .populate("category", "name slug")
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ flashSaleEndTime: 1 }); // Ending soonest first

  const earliestEndTime = products[0]?.flashSaleEndTime || null;

  res.json(
    new ApiResponse(200, {
      products,
      flashSaleEndTime: earliestEndTime,
      count: products.length,
    }),
  );
});

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
export const getProductsByCategory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, sort } = req.query;

  const products = await Product.find({
    category: req.params.categoryId,
    isActive: true,
  })
    .populate("category", "name slug")
    .sort(
      sort === "price-asc"
        ? { price: 1 }
        : sort === "price-desc"
          ? { price: -1 }
          : { createdAt: -1 },
    )
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Product.countDocuments({
    category: req.params.categoryId,
    isActive: true,
  });

  res.json(
    new ApiResponse(200, {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }),
  );
});

// @desc    Create product (Admin)
// @route   POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name", "description", "price", "comparePrice", "category",
    "brand", "stock", "images", "variants", "isFeatured",
    "isFlashSale", "flashSalePrice", "flashSaleEndTime", "isActive",
  ];

  const productData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      productData[field] = req.body[field];
    }
  }

  const product = await Product.create(productData);
  res.status(201).json(new ApiResponse(201, { product }, "Product created"));
});

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name",
    "description",
    "price",
    "comparePrice",
    "category",
    "brand",
    "stock",
    "images",
    "variants",
    "specifications",
    "isFeatured",
    "isFlashSale",
    "flashSaleEndTime",
    "isActive",
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  Object.assign(product, updateData);
  await product.save();

  res.json(new ApiResponse(200, { product }, "Product updated"));
});

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  // Delete images from Cloudinary
  const deletePromises = product.images
    .filter((image) => image.public_id)
    .map((image) => deleteFromCloudinary(image.public_id));
  if (deletePromises.length > 0) {
    await Promise.all(deletePromises);
  }

  await product.deleteOne();
  res.json(new ApiResponse(200, null, "Product deleted"));
});

// @desc    Upload product images (Admin)
// @route   POST /api/products/:id/images
export const uploadProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  if (!req.files?.length) {
    throw ApiError.badRequest("Please upload images");
  }

  if (product.images.length + req.files.length > 5) {
    throw ApiError.badRequest("Maximum 5 images allowed");
  }

  const uploadPromises = req.files.map((file) =>
    uploadToCloudinary(file.buffer, "westore/products"),
  );
  const results = await Promise.all(uploadPromises);

  product.images.push(...results);
  await product.save();

  res.json(new ApiResponse(200, { images: product.images }, "Images uploaded"));
});

// @desc    Delete product image (Admin)
// @route   DELETE /api/products/:id/images/:imageId
export const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const image = product.images.id(req.params.imageId);

  if (!image) {
    throw ApiError.notFound("Image not found");
  }

  if (image.public_id) {
    await deleteFromCloudinary(image.public_id);
  }

  image.deleteOne();
  await product.save();

  res.json(new ApiResponse(200, null, "Image deleted"));
});
