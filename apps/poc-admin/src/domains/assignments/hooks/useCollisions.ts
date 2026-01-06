import { useState, useEffect } from 'react';
import { TemplateCollision } from '../types';
import { assignmentService } from '../services/assignmentService';

export const useCollisions = () => {
  const [collisions, setCollisions] = useState<TemplateCollision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollisions = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getCollisions();
      setCollisions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollisions();
  }, []);

  return {
    collisions,
    loading,
    error,
    refetch: fetchCollisions
  };
};
