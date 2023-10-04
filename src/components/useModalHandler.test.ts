import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { ButtonPrimary } from 'src/components/common';
import Modal from 'src/components/Modal';
import { useModalHandler } from 'src/components/useModalHandler';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

type ModalMockExports = typeof import('src/components/Modal.mock');
jest.mock('src/components/Modal', () => {
  const mockModal = jest.requireActual<ModalMockExports>('src/components/Modal.mock');
  return mockModal.mockModalModule();
});

describe('useModalHandler helper hook', () => {
  interface TestComponentProps {
    onCloseThing: (args: string) => void;
    onSuccess: (args: string) => void;
  }
  const TestComponent = (props: TestComponentProps): ReactNode => {
    const { onSuccess, onCloseThing } = props;
    /* in most cases, usage will leverage a custom variant of Modal that
       streamlines the hook usage a bit, but we are using raw Modal since
       it is sufficient for testing */
    const myModal = useModalHandler((args: string, close: () => void) =>
      h(
        Modal,
        {
          title: `Modal for ${args}.`,
          onDismiss: () => {
            close();
            onCloseThing(args);
          },
          okButton: () => {
            close();
            onSuccess(args);
          },
        },
        [span([`content for ${args}`])]
      )
    );
    return div([
      h(
        ButtonPrimary,
        {
          onClick: () => myModal.open('ThingOne'),
        },
        ['Open One']
      ),
      h(
        ButtonPrimary,
        {
          onClick: () => myModal.open('ThingTwo'),
        },
        ['Open Two']
      ),
      myModal.maybeRender(),
    ]);
  };

  it('renders no modal initially', () => {
    // Arrange

    // Act
    render(
      h(TestComponent, {
        onCloseThing: () => {},
        onSuccess: () => {},
      })
    );

    // Assert
    expect(screen.queryAllByText('Modal for ThingOne.').length).toBe(0);
    expect(screen.queryAllByText('Modal for ThingTwo.').length).toBe(0);
  });

  it('opens modal with correct args flow', () => {
    // Arrange
    render(
      h(TestComponent, {
        onCloseThing: () => {},
        onSuccess: () => {},
      })
    );

    // Act
    const button = screen.getByText('Open One');
    fireEvent.click(button);

    // Assert
    expect(screen.queryAllByText('Modal for ThingOne.').length).toBe(1);
    expect(screen.queryAllByText('Modal for ThingTwo.').length).toBe(0);
  });

  it('opens modal with correct args flow - 2nd item', () => {
    // Arrange
    render(
      h(TestComponent, {
        onCloseThing: () => {},
        onSuccess: () => {},
      })
    );

    // Act
    const button = screen.getByText('Open Two');
    fireEvent.click(button);

    // Assert
    expect(screen.queryAllByText('Modal for ThingOne.').length).toBe(0);
    expect(screen.queryAllByText('Modal for ThingTwo.').length).toBe(1);
  });

  it('closes modal - OK button', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSuccessWatcher = jest.fn();

    render(
      h(TestComponent, {
        onCloseThing: () => {},
        onSuccess: onSuccessWatcher,
      })
    );

    const button = screen.getByText('Open One');
    fireEvent.click(button);

    // Act
    const okButton = screen.getByText('OK');
    await user.click(okButton);

    // Assert
    expect(onSuccessWatcher).toBeCalledTimes(1);
    expect(onSuccessWatcher).toBeCalledWith('ThingOne');
    expect(screen.queryAllByText('Modal for ThingOne.').length).toBe(0);
    expect(screen.queryAllByText('Modal for ThingTwo.').length).toBe(0);
  });

  it('handles modal cancel', async () => {
    // Arrange
    const user = userEvent.setup();
    const onCloseWatcher = jest.fn();

    render(
      h(TestComponent, {
        onCloseThing: onCloseWatcher,
        onSuccess: () => {},
      })
    );

    const button = screen.getByText('Open One');
    fireEvent.click(button);

    // Act
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Assert
    expect(onCloseWatcher).toBeCalledTimes(1);
    expect(onCloseWatcher).toBeCalledWith('ThingOne');
    expect(screen.queryAllByText('Modal for ThingOne.').length).toBe(0);
    expect(screen.queryAllByText('Modal for ThingTwo.').length).toBe(0);
  });
});
