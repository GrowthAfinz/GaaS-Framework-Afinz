import { describe, expect, it } from 'vitest';
import { collapseStrategySections, toggleStrategySection } from './sectionVisibility';

describe('Strategy sections with an active draft', () => {
  it('opens activities while a different section is being edited', () => {
    const closed = new Set(['activities']);
    expect(toggleStrategySection(closed, 'activities', new Set(['context']))).toEqual(new Set());
    expect(closed.has('activities')).toBe(true);
  });
  it('allows reopening even a protected section with a recovered draft', () => {
    expect(toggleStrategySection(new Set(['activities']), 'activities', new Set(['activities']))).toEqual(new Set());
  });
  it('protects only the section containing the draft from collapse', () => {
    const protectedIds = new Set(['activities']);
    expect(toggleStrategySection(new Set(), 'activities', protectedIds)).toEqual(new Set());
    expect(toggleStrategySection(new Set(), 'context', protectedIds)).toEqual(new Set(['context']));
  });
  it('collapses other sections while keeping the editor accessible', () => {
    expect(collapseStrategySections(['activities','context','sql'], new Set(['activities']))).toEqual(new Set(['context','sql']));
  });
});
