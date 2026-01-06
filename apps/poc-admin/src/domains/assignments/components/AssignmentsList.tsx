import React from 'react';
import { Card, DataTable, Badge, Button } from '@shopify/polaris';
import { useAssignments } from '../hooks/useAssignments';

export const AssignmentsList: React.FC = () => {
  const { assignments, loading, deleteAssignment } = useAssignments();

  const rows = assignments.map(assignment => [
    assignment.templateName,
    assignment.scope.type,
    assignment.scope.values?.join(', ') || 'Globális',
    assignment.priority,
    <Badge status={assignment.isActive ? 'success' : 'critical'}>
      {assignment.isActive ? 'Active' : 'Inactive'}
    </Badge>,
    <Button 
      destructive 
      size="slim" 
      onClick={() => deleteAssignment(assignment.id)}
    >
      Delete
    </Button>
  ]);

  return (
    <Card>
      <DataTable
        columnContentTypes={['text', 'text', 'text', 'numeric', 'text', 'text']}
        headings={['Template', 'Scope Type', 'Values', 'Priority', 'Status', 'Actions']}
        rows={rows}
        loading={loading}
      />
    </Card>
  );
};
