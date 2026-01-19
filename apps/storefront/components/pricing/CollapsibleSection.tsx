/**
 * CollapsibleSection Component
 * Dekormunka-style numbered collapsible section
 */

'use client';

import React, { useState } from 'react';

interface CollapsibleSectionProps {
  number: number;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  number,
  title,
  children,
  defaultOpen = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`collapsible-section ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="collapsible-header"
      >
        <div className="collapsible-header-left">
          <span className="collapsible-number">{number}.</span>
          <span className="collapsible-title">{title}</span>
        </div>
        <svg
          className={`collapsible-chevron ${isOpen ? 'open' : ''}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Content */}
      <div className={`collapsible-content ${isOpen ? 'open' : ''}`}>
        <div className="collapsible-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
