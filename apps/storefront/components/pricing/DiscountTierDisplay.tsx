/**
 * DiscountTierDisplay Component
 *
 * Shows available quantity discount tiers.
 */

'use client';

import React from 'react';
import type { DiscountTier } from '@/types/pricing';

interface DiscountTierDisplayProps {
  tiers: DiscountTier[];
  currentQuantity: number;
}

export function DiscountTierDisplay({
  tiers,
  currentQuantity,
}: DiscountTierDisplayProps) {
  if (!tiers || tiers.length === 0) {
    return null;
  }

  // Sort tiers by minQty
  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);

  // Find current active tier
  const activeTier = sortedTiers.find((tier) => {
    const meetsMin = currentQuantity >= tier.minQty;
    const meetsMax = tier.maxQty === null || currentQuantity <= tier.maxQty;
    return meetsMin && meetsMax;
  });

  return (
    <div className="priceflow-discount-tiers">
      <div className="priceflow-discount-title">
        Mennyiségi kedvezmények
      </div>

      <div className="priceflow-discount-list">
        {sortedTiers.map((tier, index) => {
          const isActive =
            activeTier &&
            tier.minQty === activeTier.minQty &&
            tier.maxQty === activeTier.maxQty;

          const rangeText =
            tier.maxQty === null
              ? `${tier.minQty}+ db`
              : `${tier.minQty}-${tier.maxQty} db`;

          return (
            <div
              key={index}
              className={`priceflow-discount-tier ${isActive ? 'active' : ''}`}
            >
              <span className="priceflow-tier-range">{rangeText}</span>
              <span className="priceflow-tier-discount">
                {tier.discount > 0 ? `-${tier.discount}%` : 'Alapár'}
              </span>
            </div>
          );
        })}
      </div>

      {activeTier && activeTier.discount > 0 && (
        <div className="priceflow-discount-active">
          Aktuális kedvezményed: <strong>-{activeTier.discount}%</strong>
        </div>
      )}
    </div>
  );
}
