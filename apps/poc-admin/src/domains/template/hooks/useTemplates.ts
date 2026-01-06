import { useState, useEffect } from 'react';
import type { Template } from '../types';
import { templateApi } from '../api';

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading templates...');
      const response = await templateApi.list();
      console.log('API response:', response);
      // Handle both response formats: {success: true, data: []} and {ok: true, data: []}
      if (response.success || (response as any).ok) {
        console.log('Templates loaded successfully:', response.data);
        setTemplates(response.data);
      } else {
        console.error('API error:', response.error);
        setError(response.error || 'Failed to load templates');
      }
    } catch (err) {
      console.error('Exception in loadTemplates:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (template: Partial<Template>) => {
    const response = await templateApi.create(template);
    if (response.success || (response as any).ok) {
      setTemplates(prev => [...prev, response.data]);
      return response.data;
    }
    throw new Error(response.error || 'Failed to create template');
  };

  const updateTemplate = async (id: string, template: Partial<Template>) => {
    const response = await templateApi.update(id, template);
    if (response.success || (response as any).ok) {
      setTemplates(prev => prev.map(t => t.id === id ? response.data : t));
      return response.data;
    }
    throw new Error(response.error || 'Failed to update template');
  };

  const deleteTemplate = async (id: string) => {
    const response = await templateApi.delete(id);
    if (response.success || (response as any).ok) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    } else {
      throw new Error(response.error || 'Failed to delete template');
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: loadTemplates,
  };
}
