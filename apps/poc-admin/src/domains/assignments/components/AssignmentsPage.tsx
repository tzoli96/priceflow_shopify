import React from 'react';
import { Page, Layout, Card } from '@shopify/polaris';
import { AssignmentsList } from './AssignmentsList';
import { CollisionsList } from './CollisionsList';
import { AssignmentForm } from './AssignmentForm';

export const AssignmentsPage: React.FC = () => {
  return (
    <Page title="Template Assignments">
      <Layout>
        <Layout.Section>
          <Card title="Create Assignment" sectioned>
            <AssignmentForm />
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card title="Active Assignments" sectioned>
            <AssignmentsList />
          </Card>
        </Layout.Section>
        
        <Layout.Section secondary>
          <Card title="Template Collisions" sectioned>
            <CollisionsList />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
