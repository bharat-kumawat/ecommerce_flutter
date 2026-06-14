import '../../domain/entities/product_entity.dart';

class ProductModel {
  final String id;
  final String name;
  final String slug;
  final String description;
  final double price;
  final double? comparePrice;
  final CategoryModel category;
  final String? brand;
  final List<ProductImageModel> images;
  final int stock;
  final int sold;
  final double ratings;
  final int numReviews;
  final bool isFeatured;
  final bool isFlashSale;
  final DateTime? flashSaleEndTime;
  final bool isActive;
  final List<ProductVariantModel> variants;
  final List<ProductSpecificationModel> specifications;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ProductModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    required this.price,
    this.comparePrice,
    required this.category,
    this.brand,
    this.images = const [],
    required this.stock,
    this.sold = 0,
    this.ratings = 0,
    this.numReviews = 0,
    this.isFeatured = false,
    this.isFlashSale = false,
    this.flashSaleEndTime,
    this.isActive = true,
    this.variants = const [],
    this.specifications = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    // Handle category which can be String (ID), Map (populated), or null
    CategoryModel category;
    final categoryData = json['category'];
    if (categoryData is Map<String, dynamic>) {
      category = CategoryModel.fromJson(categoryData);
    } else if (categoryData is String) {
      // If category is just an ID, create a minimal CategoryModel
      category = CategoryModel(id: categoryData, name: '', slug: '');
    } else {
      category = const CategoryModel(id: '', name: '', slug: '');
    }

    return ProductModel(
      id: json['_id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      description: json['description'] as String? ?? '',
      price: (json['price'] as num).toDouble(),
      comparePrice: json['comparePrice'] != null
          ? (json['comparePrice'] as num).toDouble()
          : null,
      category: category,
      brand: json['brand'] as String?,
      images: (json['images'] as List<dynamic>?)
              ?.map(
                  (e) => ProductImageModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      stock: json['stock'] as int? ?? 0,
      sold: json['sold'] as int? ?? 0,
      ratings: (json['ratings'] as num?)?.toDouble() ?? 0,
      numReviews: json['numReviews'] as int? ?? 0,
      isFeatured: json['isFeatured'] as bool? ?? false,
      isFlashSale: json['isFlashSale'] as bool? ?? false,
      flashSaleEndTime: json['flashSaleEndTime'] != null
          ? DateTime.tryParse(json['flashSaleEndTime'] as String)?.toLocal()
          : null,
      isActive: json['isActive'] as bool? ?? true,
      variants: (json['variants'] as List<dynamic>?)
              ?.map((e) =>
                  ProductVariantModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      specifications: (json['specifications'] as List<dynamic>?)
              ?.map((e) =>
                  ProductSpecificationModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)?.toLocal() ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)?.toLocal() ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'price': price,
      'comparePrice': comparePrice,
      'category': category.toJson(),
      'brand': brand,
      'images': images.map((e) => e.toJson()).toList(),
      'stock': stock,
      'sold': sold,
      'ratings': ratings,
      'numReviews': numReviews,
      'isFeatured': isFeatured,
      'isFlashSale': isFlashSale,
      'flashSaleEndTime': flashSaleEndTime?.toIso8601String(),
      'isActive': isActive,
      'variants': variants.map((e) => e.toJson()).toList(),
      'specifications': specifications.map((e) => e.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  ProductEntity toEntity() {
    return ProductEntity(
      id: id,
      name: name,
      slug: slug,
      description: description,
      price: price,
      comparePrice: comparePrice,
      category: category.toEntity(),
      brand: brand,
      images: images.map((e) => e.toEntity()).toList(),
      stock: stock,
      sold: sold,
      ratings: ratings,
      numReviews: numReviews,
      isFeatured: isFeatured,
      isFlashSale: isFlashSale,
      flashSaleEndTime: flashSaleEndTime,
      isActive: isActive,
      variants: variants.map((e) => e.toEntity()).toList(),
      specifications: specifications.map((e) => e.toEntity()).toList(),
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

class ProductImageModel {
  final String publicId;
  final String url;

  const ProductImageModel({
    required this.publicId,
    required this.url,
  });

  factory ProductImageModel.fromJson(Map<String, dynamic> json) {
    return ProductImageModel(
      publicId: json['public_id'] as String? ?? '',
      url: json['url'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'public_id': publicId,
      'url': url,
    };
  }

  ProductImageEntity toEntity() {
    return ProductImageEntity(
      publicId: publicId,
      url: url,
    );
  }
}

class CategoryModel {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final CategoryImageModel? image;
  final String? parentId;
  final bool isActive;

  const CategoryModel({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.image,
    this.parentId,
    this.isActive = true,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    final parent = json['parent'];
    final String? parentId = switch (parent) {
      String() => parent,
      Map<String, dynamic>() => parent['_id'] as String?,
      _ => null,
    };

    return CategoryModel(
      id: json['_id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      description: json['description'] as String?,
      image: json['image'] != null
          ? CategoryImageModel.fromJson(json['image'] as Map<String, dynamic>)
          : null,
      parentId: parentId,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'image': image?.toJson(),
      'parent': parentId,
      'isActive': isActive,
    };
  }

  CategoryEntity toEntity() {
    return CategoryEntity(
      id: id,
      name: name,
      slug: slug,
      description: description,
      image: image?.toEntity(),
      parentId: parentId,
      isActive: isActive,
    );
  }
}

class CategoryImageModel {
  final String publicId;
  final String url;

  const CategoryImageModel({
    required this.publicId,
    required this.url,
  });

  factory CategoryImageModel.fromJson(Map<String, dynamic> json) {
    return CategoryImageModel(
      publicId: json['public_id'] as String? ?? '',
      url: json['url'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'public_id': publicId,
      'url': url,
    };
  }

  CategoryImageEntity toEntity() {
    return CategoryImageEntity(
      publicId: publicId,
      url: url,
    );
  }
}

class ProductVariantModel {
  final String name;
  final List<VariantOptionModel> options;

  const ProductVariantModel({
    required this.name,
    this.options = const [],
  });

  factory ProductVariantModel.fromJson(Map<String, dynamic> json) {
    return ProductVariantModel(
      name: json['name'] as String,
      options: (json['options'] as List<dynamic>?)
              ?.map(
                  (e) => VariantOptionModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'options': options.map((e) => e.toJson()).toList(),
    };
  }

  ProductVariantEntity toEntity() {
    return ProductVariantEntity(
      name: name,
      options: options.map((e) => e.toEntity()).toList(),
    );
  }
}

class VariantOptionModel {
  final String value;
  final double priceModifier;
  final int stock;

  const VariantOptionModel({
    required this.value,
    this.priceModifier = 0,
    this.stock = 0,
  });

  factory VariantOptionModel.fromJson(Map<String, dynamic> json) {
    return VariantOptionModel(
      value: json['value'] as String,
      priceModifier: (json['priceModifier'] as num?)?.toDouble() ?? 0,
      stock: json['stock'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'value': value,
      'priceModifier': priceModifier,
      'stock': stock,
    };
  }

  VariantOptionEntity toEntity() {
    return VariantOptionEntity(
      value: value,
      priceModifier: priceModifier,
      stock: stock,
    );
  }
}

class ProductSpecificationModel {
  final String key;
  final String value;

  const ProductSpecificationModel({
    required this.key,
    required this.value,
  });

  factory ProductSpecificationModel.fromJson(Map<String, dynamic> json) {
    return ProductSpecificationModel(
      key: json['key'] as String,
      value: json['value'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'key': key,
      'value': value,
    };
  }

  ProductSpecificationEntity toEntity() {
    return ProductSpecificationEntity(
      key: key,
      value: value,
    );
  }
}
