import { useState, useEffect } from 'react';
import { TemplateAssignment } from '../types';
import { assignmentService } from '../services/assignmentService';

export const useAssignments = () => {
  const [assignments, setAssignments] = useState<TemplateAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getAssignments();
      setAssignments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (assignment: Omit<TemplateAssignment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newAssignment = await assignmentService.createAssignment(assignment);
      setAssignments(prev => [...prev, newAssignment]);
      return newAssignment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
      throw err;
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      await assignmentService.deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assignment');
      throw err;
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return {
    assignments,
    loading,
    error,
    createAssignment,
    deleteAssignment,
    refetch: fetchAssignments
  };
};
