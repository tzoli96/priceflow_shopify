import React from 'react';
import { Card, DataTable, Badge } from '@shopify/polaris';
import { useCollisions } from '../hooks/useCollisions';

export const CollisionsList: React.FC = () => {
  const { collisions, loading } = useCollisions();

  const rows = collisions.map(collision => [
    collision.productTitle,
    collision.assignments.length,
    collision.assignments.map(a => a.templateName).join(', '),
    <Badge status="warning">
      {collision.conflictType === 'multiple_templates' ? 'Multiple Templates' : 'Priority Conflict'}
    </Badge>
  ]);

  return (
    <Card>
      <DataTable
        columnContentTypes={['text', 'numeric', 'text', 'text']}
        headings={['Product', 'Template Count', 'Templates', 'Conflict Type']}
        rows={rows}
        loading={loading}
      />
    </Card>
  );
};
