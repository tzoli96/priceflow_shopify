/**
 * CollapsibleSection Component
 * Dekormunka-style numbered collapsible section
 */

'use client';

import React, { useState } from 'react';

interface CollapsibleSectionProps {
  number?: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  showNumber?: boolean;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  number,
  title,
  description,
  children,
  defaultOpen = true,
  collapsible = true,
  showNumber = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    if (collapsible) {
      setIsOpen(!isOpen);
    }
  };

  // Always open if not collapsible
  const isContentOpen = collapsible ? isOpen : true;

  return (
    <div className={`collapsible-section ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        className={`collapsible-header ${!collapsible ? 'not-collapsible' : ''}`}
        disabled={!collapsible}
      >
        <div className="collapsible-header-left">
          {showNumber && number !== undefined && number > 0 && (
            <span className="collapsible-number">{number}.</span>
          )}
          <span className="collapsible-title">{title}</span>
        </div>
        {collapsible && (
          <svg
            className={`collapsible-chevron ${isContentOpen ? 'open' : ''}`}
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
        )}
      </button>

      {/* Content */}
      <div className={`collapsible-content ${isContentOpen ? 'open' : ''}`}>
        <div className="collapsible-content-inner">
          {description && (
            <p className="section-description">{description}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
