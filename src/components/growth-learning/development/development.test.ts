import {describe,it,expect} from 'vitest';
import {readTaskView} from './TasksWorkspace';
import {taskError} from './developmentService';
describe('navigation for development and existing CRM investigations',()=>{
 it('opens notification deep links in development and preserves existing investigation links',()=>{
  expect(readTaskView('?view=learning&section=investigations&dev_task=task')).toBe('development');
  expect(readTaskView('?view=learning&section=investigations&item=investigation')).toBe('investigations');
  expect(readTaskView('?task_view=investigations')).toBe('investigations');
  expect(readTaskView('')).toBe('development');
 });
 it('explains stale edits, pending dependencies and missing conclusion evidence',()=>{
  expect(taskError({message:'task_revision_conflict'})).toContain('reabra');
  expect(taskError({message:'task_dependencies_pending'})).toContain('dependências');
  expect(taskError({message:'task_completion_evidence_required'})).toContain('critérios');
 });
});
