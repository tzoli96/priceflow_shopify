/**
 * Product Response DTO
 *
 * Shopify termék adatok response-a
 */

export class ProductResponseDto {
  id: string;
  title: string;
  vendor: string;
  productType: string;
  handle: string;
  tags: string[];
  status: string;
  variants: ProductVariantDto[];
  images: ProductImageDto[];

  static fromShopifyProduct(product: any): ProductResponseDto {
    return {
      id: product.id?.toString() || '',
      title: product.title || '',
      vendor: product.vendor || '',
      productType: product.product_type || '',
      handle: product.handle || '',
      tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
      status: product.status || '',
      variants: (product.variants || []).map((v: any) => ProductVariantDto.fromShopifyVariant(v)),
      images: (product.images || []).map((i: any) => ProductImageDto.fromShopifyImage(i)),
    };
  }
}

export class ProductVariantDto {
  id: string;
  title: string;
  price: string;
  sku: string;
  inventoryQuantity: number;

  static fromShopifyVariant(variant: any): ProductVariantDto {
    return {
      id: variant.id?.toString() || '',
      title: variant.title || '',
      price: variant.price || '0',
      sku: variant.sku || '',
      inventoryQuantity: variant.inventory_quantity || 0,
    };
  }
}

export class ProductImageDto {
  id: string;
  src: string;
  alt: string | null;

  static fromShopifyImage(image: any): ProductImageDto {
    return {
      id: image.id?.toString() || '',
      src: image.src || '',
      alt: image.alt || null,
    };
  }
}
