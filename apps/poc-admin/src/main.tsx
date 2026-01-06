/**
 * Main application entry point
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { TemplateManager } from './domains/template';
import huTranslations from "@/locales/hu.json";

// ============================================================================
// Main App Component
// ============================================================================

function App() {
  return (
    <AppProvider i18n={huTranslations}>
      <TemplateManager />
    </AppProvider>
  );
}

// ============================================================================
// Render
// ============================================================================

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
