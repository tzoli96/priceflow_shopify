/**
 * PresetChips Component
 * Előre definiált értékek gyorsgombok formájában
 * Dekormunka design alapján (pl. méret gyorsgombok)
 */

'use client';

import React from 'react';
import type { PresetValue } from '@/types/pricing';

interface PresetChipsProps {
  presets: PresetValue[];
  currentValue: number | string | Record<string, number>;
  onSelect: (value: number | string | Record<string, number>) => void;
  label?: string;
}

export const PresetChips: React.FC<PresetChipsProps> = ({
  presets,
  currentValue,
  onSelect,
  label,
}) => {
  const isSelected = (preset: PresetValue): boolean => {
    if (typeof preset.value === 'object' && typeof currentValue === 'object') {
      return JSON.stringify(preset.value) === JSON.stringify(currentValue);
    }
    return preset.value === currentValue;
  };

  return (
    <div className="preset-chips">
      {label && (
        <span className="text-xs text-gray-500 mb-2 block">{label}</span>
      )}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset, index) => {
          const selected = isSelected(preset);

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(preset.value)}
              className={`
                px-3 py-1.5 text-sm rounded-full border transition-all duration-200
                ${selected
                  ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-pink-400 hover:text-pink-600'
                }
              `}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PresetChips;
