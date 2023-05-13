import { FunctionComponent } from 'react';
import { vi } from 'vitest';

export type ModalExports = typeof import('src/components/Modal') & { __esModule: true };

/**
 * provides a mocked version of Modal module's Modal component that avoids
 * pitfalls specific to missing services in jest simulated browser environment
 * including dom measurement calls.
 */
export const mockModalModule = async (): Promise<ModalExports> => {
  const originalModule = <any>await vi.importActual<ModalExports>('src/components/Modal');

  type ModalFn = FunctionComponent & { propTypes: typeof originalModule.modalPropTypes };

  // Stub out onAfterOpen for noOp because the real implementation needs
  // unavailable dom measuring services.
  // Note that this issue may not show up in non-async tests, since the
  // internal implementation of react-modal only hits onAfterOpen as part of
  // a requestAnimationFrame async flow.
  function modalFn(props) {
    return originalModule.default({ onAfterOpen: vi.fn(), ...props });
  }
  modalFn.propTypes = originalModule.modalPropTypes;

  type MockedModalFn = ModalFn & vi.mock;
  const mockModalFn: MockedModalFn = vi.fn(modalFn) as MockedModalFn;

  return {
    ...originalModule,
    __esModule: true,
    default: mockModalFn,
  };
};
