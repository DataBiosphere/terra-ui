import { FunctionComponent } from 'react'


export type ModalExports = typeof import('src/components/Modal') & { __esModule: true }

/**
 * provides a mocked version of Modal module's Modal component that avoids
 * pitfalls specific to missing services in jest simulated browser environment
 * including dom measurement calls.
 */
export const mockModalModule = (): ModalExports => {
  const originalModule = jest.requireActual<ModalExports>('src/components/Modal')

  type ModalFn = FunctionComponent & {propTypes: typeof originalModule.modalPropTypes};

  // Stub out onAfterOpen for noOp because real implementation needs
  // unavailable dom measuring services
  const modalFn = props => originalModule.default({ onAfterOpen: jest.fn(), ...props })
  modalFn.propTypes = originalModule.modalPropTypes

  type MockedModalFn = ModalFn & jest.Mock
  const mockModalFn: MockedModalFn = jest.fn(modalFn) as MockedModalFn

  return {
    ...originalModule,
    __esModule: true,
    default: mockModalFn
  }
}
