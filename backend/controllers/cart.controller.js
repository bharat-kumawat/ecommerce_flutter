import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const buildVariantFromProduct = (product, variant) => {
  if (!variant || (!variant.name && !variant.value)) return undefined;

  const variantGroup = product.variants.find((group) => group.name === variant.name);
  const option = variantGroup?.options.find((item) => item.value === variant.value);

  if (!variantGroup || !option) {
    throw ApiError.badRequest("Selected variant is not available");
  }

  if (option.stock < 1) {
    throw ApiError.badRequest("Selected variant is out of stock");
  }

  return {
    name: variantGroup.name,
    value: option.value,
    priceModifier: option.priceModifier || 0,
  };
};

// @desc    Get user cart
// @route   GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "name price images stock slug",
  );

  if (!cart) {
    cart = { items: [], total: 0 };
  }

  res.json(new ApiResponse(200, { cart }));
});

// @desc    Add item to cart
// @route   POST /api/cart
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  if (!product.isActive) {
    throw ApiError.badRequest("Product is not available");
  }

  const normalizedVariant = buildVariantFromProduct(product, variant);

  if (product.stock < quantity) {
    throw ApiError.badRequest("Insufficient stock");
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const sameVariant = (a, b) => {
    const aEmpty = !a || (!a.name && !a.value);
    const bEmpty = !b || (!b.name && !b.value);
    if (aEmpty && bEmpty) return true;
    if (aEmpty || bEmpty) return false;
    return a.name === b.name && a.value === b.value;
  };

  const existingItem = cart.items.find(
    (item) =>
      item.product.toString() === productId &&
      sameVariant(item.variant, normalizedVariant),
  );

  const nextQuantity = (existingItem?.quantity || 0) + quantity;
  if (product.stock < nextQuantity) {
    throw ApiError.badRequest("Insufficient stock");
  }

  if (existingItem) {
    existingItem.quantity = nextQuantity;
  } else {
    cart.items.push({ product: productId, quantity, variant: normalizedVariant });
  }

  await cart.save();
  await cart.populate("items.product", "name price images stock slug");

  res.json(new ApiResponse(200, { cart }, "Item added to cart"));
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw ApiError.notFound("Cart not found");
  }

  const item = cart.items.id(req.params.itemId);

  if (!item) {
    throw ApiError.notFound("Item not found in cart");
  }

  const product = await Product.findById(item.product);
  if (!product) {
    throw ApiError.notFound("Product no longer exists");
  }
  if (!product.isActive) {
    throw ApiError.badRequest("Product is no longer available");
  }
  if (product.stock < quantity) {
    throw ApiError.badRequest("Insufficient stock");
  }

  item.quantity = quantity;
  await cart.save();
  await cart.populate("items.product", "name price images stock slug");

  res.json(new ApiResponse(200, { cart }, "Cart updated"));
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
export const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw ApiError.notFound("Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== req.params.itemId,
  );
  await cart.save();
  await cart.populate("items.product", "name price images stock slug");

  res.json(new ApiResponse(200, { cart }, "Item removed from cart"));
});

// @desc    Clear cart
// @route   DELETE /api/cart
export const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json(new ApiResponse(200, null, "Cart cleared"));
});
