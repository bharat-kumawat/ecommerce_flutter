import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0.01, "Price must be greater than zero"],
    },
    comparePrice: {
      type: Number,
      min: [0, "Compare price cannot be negative"],
      validate: {
        validator(value) {
          return value === undefined || value === null || value >= this.price;
        },
        message: "Compare price cannot be less than product price",
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [100, "Brand cannot exceed 100 characters"],
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
      max: [999999, "Stock is too large"],
    },
    sold: {
      type: Number,
      default: 0,
      min: [0, "Sold count cannot be negative"],
    },
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: [0, "Review count cannot be negative"],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isFlashSale: {
      type: Boolean,
      default: false,
      index: true,
    },
    flashSalePrice: {
      type: Number,
      min: [0.01, "Flash sale price must be greater than zero"],
      validate: {
        validator(value) {
          return value === undefined || value === null || value < this.price;
        },
        message: "Flash sale price must be less than product price",
      },
    },
    flashSaleEndTime: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    variants: [
      {
        name: { type: String, trim: true, maxlength: 60 },
        options: [
          {
            value: { type: String, trim: true, maxlength: 80 },
            priceModifier: { type: Number, default: 0, min: 0 },
            stock: { type: Number, default: 0, min: 0 },
          },
        ],
      },
    ],
    specifications: [
      {
        key: { type: String, trim: true, maxlength: 100 },
        value: { type: String, trim: true, maxlength: 500 },
      },
    ],
  },
  { timestamps: true },
);

// Generate a unique slug before save
productSchema.pre("save", async function () {
  if (!this.isModified("name")) return;

  const baseSlug = slugify(this.name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await mongoose.models.Product.exists({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  this.slug = slug;
});

// Index for search
productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ isActive: 1, category: 1, price: 1, ratings: 1 });
productSchema.index({ isActive: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
