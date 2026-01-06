// Assignments Domain exports
export * from './constants';
export type { TemplateAssignment, TemplateCollision } from './types';
export { useAssignments } from './hooks/useAssignments';
export { useCollisions } from './hooks/useCollisions';
export { AssignmentsList } from './components/AssignmentsList';
export { CollisionsList } from './components/CollisionsList';
export { AssignmentForm } from './components/AssignmentForm';
export { ScopeSection } from './components/ScopeSection';
export { ScopeSelector } from './components/ScopeSelector';
export { AssignmentsPage } from './components/AssignmentsPage';
export { assignmentService } from './services/assignmentService';

// Scope exports
export type {
    ScopeType,
    ScopeProduct,
    ScopeCollection,
    ScopeVendor,
    ScopeTag,
    ScopeApiResponse,
    ScopeSearchParams,
} from './types/scope.types';
export { ScopeApiService } from './services/scope.api';
export {
    useScope,
    useScopeProducts,
    useScopeCollections,
    useScopeVendors,
    useScopeTags,
} from './hooks/useScope';
