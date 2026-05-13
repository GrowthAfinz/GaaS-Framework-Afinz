/**
 * =============================================================================
 * DISPATCH MODULE - Barrel Exports
 * =============================================================================
 *
 * Modal de Programacao de Disparos com IA Avancada
 *
 * Uso:
 *   import { ProgramarDisparoModalV2 } from '@/components/dispatch';
 *
 *   <ProgramarDisparoModalV2
 *     isOpen={isOpen}
 *     onClose={handleClose}
 *     onSuccess={handleSuccess}
 *     activeSegmento={segmento}
 *   />
 */

// Modal Principal
// Modal Principal
export { ProgramarDisparoModal } from './ProgramarDisparoModal';

// Context
export { DispatchFormProvider, useDispatchForm } from './context/DispatchFormContext';
export type { DispatchFormData, HistoricalOptions } from './context/DispatchFormContext';

// Blocos do Layout
export {
    IdentificationBlock,
    ScheduleBlock,
    ProductOfferBlock,
    InvestmentBlock,
    AIProjectionBlock
} from './blocks';

// Componentes de IA
export {
    FieldProjectionTooltip,
    ConfidenceBar,
    CausalFactorsList,
    SimilarCampaignsList
} from './ai';

// Componentes de Form
export {
    SmartInput,
    SmartSelect
} from './form';

// Hooks
export { useFieldProjection } from './hooks';
