/**
 * Collection Response DTO
 *
 * Shopify kollekció adatok response-a
 */

export class CollectionResponseDto {
  id: string;
  title: string;
  handle: string;
  type: 'custom' | 'smart';
  productsCount?: number;

  static fromShopifyCollection(collection: any, type: 'custom' | 'smart'): CollectionResponseDto {
    return {
      id: collection.id?.toString() || '',
      title: collection.title || '',
      handle: collection.handle || '',
      type,
      productsCount: collection.products_count,
    };
  }
}
