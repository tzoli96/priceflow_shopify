import { TemplateAssignment, TemplateCollision } from '../types';
import { mockAssignments, mockCollisions } from '../data/mockData';

const USE_MOCK_DATA = true; // Switch to false when API is ready

class AssignmentService {
  async getAssignments(): Promise<TemplateAssignment[]> {
    if (USE_MOCK_DATA) {
      return Promise.resolve(mockAssignments);
    }
    
    const response = await fetch('/api/v1/assignments');
    return response.json();
  }

  async createAssignment(assignment: Omit<TemplateAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<TemplateAssignment> {
    if (USE_MOCK_DATA) {
      const newAssignment: TemplateAssignment = {
        ...assignment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockAssignments.push(newAssignment);
      return Promise.resolve(newAssignment);
    }

    const response = await fetch('/api/v1/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment)
    });
    return response.json();
  }

  async deleteAssignment(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      const index = mockAssignments.findIndex(a => a.id === id);
      if (index > -1) mockAssignments.splice(index, 1);
      return Promise.resolve();
    }

    await fetch(`/api/v1/assignments/${id}`, { method: 'DELETE' });
  }

  async getCollisions(): Promise<TemplateCollision[]> {
    if (USE_MOCK_DATA) {
      return Promise.resolve(mockCollisions);
    }

    const response = await fetch('/api/v1/assignments/collisions');
    return response.json();
  }
}

export const assignmentService = new AssignmentService();
