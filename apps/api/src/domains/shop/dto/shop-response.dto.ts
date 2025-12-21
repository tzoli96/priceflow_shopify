export class ShopResponseDto {
  success: boolean;
  data?: {
    shop: string;
    isActive: boolean;
    installedAt: Date;
  };
  error?: string;

  static success(
    shop: string,
    isActive: boolean,
    installedAt: Date,
  ): ShopResponseDto {
    return {
      success: true,
      data: {
        shop,
        isActive,
        installedAt,
      },
    };
  }

  static error(message: string): ShopResponseDto {
    return {
      success: false,
      error: message,
    };
  }
}
