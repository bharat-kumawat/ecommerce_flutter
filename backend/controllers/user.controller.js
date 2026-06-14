import User from "../models/user.model.js";
import Address from "../models/address.model.js";
import Cart from "../models/cart.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";
import Notification from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../middlewares/upload.middleware.js";

// @desc    Get user profile
// @route   GET /api/users/profile
export const getProfile = asyncHandler(async (req, res) => {
  const [user, ordersCount, reviewsCount] = await Promise.all([
    User.findById(req.user._id).populate("wishlist", "name price images"),
    Order.countDocuments({ user: req.user._id }),
    Review.countDocuments({ user: req.user._id }),
  ]);

  const sanitized = user.toObject();

  sanitized.ordersCount = ordersCount;
  sanitized.reviewsCount = reviewsCount;

  res.json(new ApiResponse(200, { user: sanitized }));
});

// @desc    Update user profile
// @route   PUT /api/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true },
  );

  res.json(new ApiResponse(200, { user }, "Profile updated"));
});

// @desc    Upload avatar
// @route   PUT /api/users/avatar
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("Please upload an image");
  }

  const user = await User.findById(req.user._id);

  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  const result = await uploadToCloudinary(req.file.buffer, "westore/avatars");
  user.avatar = result;
  await user.save();

  res.json(new ApiResponse(200, { avatar: user.avatar }, "Avatar uploaded"));
});

// @desc    Delete avatar
// @route   DELETE /api/users/avatar
export const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
    user.avatar = undefined;
    await user.save();
  }

  res.json(new ApiResponse(200, null, "Avatar removed"));
});

// @desc    Get user addresses
// @route   GET /api/users/addresses
export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort(
    "-isDefault",
  );
  res.json(new ApiResponse(200, { addresses }));
});

// @desc    Add address
// @route   POST /api/users/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const address = await Address.create({ ...req.body, user: req.user._id });
  res.status(201).json(new ApiResponse(201, { address }, "Address added"));
});

// @desc    Update address
// @route   PUT /api/users/addresses/:id
export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!address) {
    throw ApiError.notFound("Address not found");
  }

  res.json(new ApiResponse(200, { address }, "Address updated"));
});

// @desc    Delete address
// @route   DELETE /api/users/addresses/:id
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!address) {
    throw ApiError.notFound("Address not found");
  }

  res.json(new ApiResponse(200, null, "Address deleted"));
});

// @desc    Get wishlist
// @route   GET /api/users/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "wishlist",
    "name price images slug ratings numReviews",
  );
  res.json(new ApiResponse(200, { wishlist: user.wishlist }));
});

// @desc    Add to wishlist
// @route   POST /api/users/wishlist/:productId
export const addToWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.wishlist.some((id) => id.equals(req.params.productId))) {
    throw ApiError.badRequest("Product already in wishlist");
  }

  user.wishlist.push(req.params.productId);
  await user.save();

  res.json(new ApiResponse(200, null, "Added to wishlist"));
});

// @desc    Remove from wishlist
// @route   DELETE /api/users/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { wishlist: req.params.productId },
  });

  res.json(new ApiResponse(200, null, "Removed from wishlist"));
});

// @desc    Check if product is in wishlist
// @route   GET /api/users/wishlist/check/:productId
export const checkWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const isInWishlist = user.wishlist.some(
    (id) => id.toString() === req.params.productId,
  );

  res.json(new ApiResponse(200, { isInWishlist }));
});

// @desc    Set default address
// @route   PATCH /api/users/addresses/:id/default
export const setDefaultAddress = asyncHandler(async (req, res) => {
  await Address.updateMany({ user: req.user._id }, { isDefault: false });

  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isDefault: true },
    { new: true },
  );

  if (!address) {
    throw ApiError.notFound("Address not found");
  }

  res.json(new ApiResponse(200, { address }, "Default address updated"));
});

// @desc    Delete user account
// @route   DELETE /api/users/profile
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  await Promise.all([
    Address.deleteMany({ user: req.user._id }),
    Cart.deleteOne({ user: req.user._id }),
    Order.deleteMany({ user: req.user._id }),
    Review.deleteMany({ user: req.user._id }),
    Notification.deleteMany({ user: req.user._id }),
  ]);

  await user.deleteOne();

  res.json(new ApiResponse(200, null, "Account deleted successfully"));
});

// @desc    Get saved card
// @route   GET /api/users/card
export const getSavedCard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json(new ApiResponse(200, { card: user.savedCard || null }));
});

// @desc    Get saved card for checkout
// @route   GET /api/users/card/checkout
export const getSavedCardForCheckout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user.savedCard || !user.savedCard.last4) {
    throw ApiError.notFound("No saved card found");
  }

  res.json(
    new ApiResponse(200, {
      card: {
        cardholderName: user.savedCard.cardholderName,
        expiry: user.savedCard.expiry,
        cardType: user.savedCard.cardType,
        last4: user.savedCard.last4,
      },
    }),
  );
});

// @desc    Save card
// @route   PUT /api/users/card
export const saveCard = asyncHandler(async (req, res) => {
  const { cardNumber, cardholderName, expiry, cardType } = req.body;

  const user = await User.findById(req.user._id);

  const cleanedCardNumber = cardNumber ? cardNumber.replace(/\s|-/g, "") : "";

  user.savedCard = {
    cardholderName,
    expiry,
    cardType: cardType || _detectCardType(cleanedCardNumber),
    last4: cleanedCardNumber.slice(-4),
  };

  await user.save();

  res.json(
    new ApiResponse(200, { card: user.savedCard }, "Card saved successfully"),
  );
});

// Helper function to detect card type
function _detectCardType(cardNumber) {
  if (cardNumber.startsWith("4")) return "visa";
  if (cardNumber.startsWith("5")) return "mastercard";
  if (cardNumber.startsWith("3")) return "amex";
  if (cardNumber.startsWith("6")) return "discover";
  return "visa";
}

// @desc    Delete saved card
// @route   DELETE /api/users/card
export const deleteCard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  user.savedCard = undefined;
  await user.save();

  res.json(new ApiResponse(200, null, "Card removed successfully"));
});
