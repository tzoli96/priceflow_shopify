/**
 * Cart Items List Component
 * Displays all cart items with quantity controls and remove buttons
 */

'use client';

import { useCart } from '@/hooks/useCart';
import { formatMoney } from '@/lib/cart/cartUtils';

/**
 * Individual cart item row
 */
function CartItemRow({
  id,
  variant_id,
  product_title,
  image,
  final_price,
  final_line_price,
  quantity,
  properties,
  onUpdateQuantity,
  onRemove,
}: {
  id: string;
  variant_id: string;
  product_title: string;
  image: string;
  final_price: number;
  final_line_price: number;
  quantity: number;
  properties: Record<string, any>;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      onUpdateQuantity(id, newQuantity);
    }
  };

  const incrementQuantity = () => {
    onUpdateQuantity(id, quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      onUpdateQuantity(id, quantity - 1);
    }
  };

  return (
    <div className="cart-item" data-item-id={id}>
      <div className="cart-item__image">
        <img src={image} alt={product_title} loading="lazy" />
      </div>

      <div className="cart-item__details">
        <h3 className="cart-item__title">{product_title}</h3>

        {/* Display custom properties */}
        {Object.keys(properties).length > 0 && (
          <div className="cart-item__properties">
            {Object.entries(properties).map(([key, value]) => (
              <div key={key} className="cart-item__property">
                <span className="property-key">{key}:</span>{' '}
                <span className="property-value">{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="cart-item__price">
          <span className="price-label">Price:</span>{' '}
          <span className="price-value">{formatMoney(final_price)}</span>
        </div>
      </div>

      <div className="cart-item__quantity">
        <label htmlFor={`quantity-${id}`} className="visually-hidden">
          Quantity for {product_title}
        </label>
        <div className="quantity-controls">
          <button
            type="button"
            className="quantity-button quantity-button--minus"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            id={`quantity-${id}`}
            className="quantity-input"
            value={quantity}
            onChange={handleQuantityChange}
            min="1"
            max="999"
            aria-label="Quantity"
          />
          <button
            type="button"
            className="quantity-button quantity-button--plus"
            onClick={incrementQuantity}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="cart-item__total">
        <span className="total-label">Total:</span>
        <span className="total-value">{formatMoney(final_line_price)}</span>
      </div>

      <div className="cart-item__remove">
        <button
          type="button"
          className="remove-button"
          onClick={() => onRemove(id)}
          aria-label={`Remove ${product_title} from cart`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Cart Items List Component
 */
export function CartItemsList() {
  const { items, isLoaded, updateQuantity, removeItem } = useCart();

  // Loading state
  if (!isLoaded) {
    return (
      <div className="cart-items-loading">
        <p>Loading cart...</p>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <p className="cart-empty__message">Your cart is empty</p>
        <a href="/" className="cart-empty__link">
          Continue shopping
        </a>
      </div>
    );
  }

  return (
    <div className="cart-items-list">
      <div className="cart-items-list__header">
        <span className="header-product">Product</span>
        <span className="header-quantity">Quantity</span>
        <span className="header-total">Total</span>
      </div>

      <div className="cart-items-list__body">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            {...item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Example Usage:
 *
 * <CartItemsList />
 */
