import { Modal } from '@terra-ui-packages/components';
import { useState } from 'react';
import { div, h, input } from 'react-hyperscript-helpers';
import { ButtonPrimary, ButtonSecondary } from 'src/components/common';
import { icon } from 'src/components/icons';

const IGVSessionModal = ({ action, savedSessions, onDismiss, onSave, onLoad }) => {
  const [sessionName, setSessionName] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);
  const [error, setError] = useState(null);

  const checkForDuplicate = (name) => {
    return savedSessions.some((session) => session.name === name);
  };

  const handleSubmit = async (forceOverwrite = false) => {
    setIsLoading(true);
    setError(null);
    try {
      if (action === 'save' && sessionName.trim()) {
        // Check for duplicate before saving
        if (!forceOverwrite && checkForDuplicate(sessionName.trim())) {
          setShowConfirmOverwrite(true);
          setIsLoading(false);
          return;
        }

        const result = await onSave(sessionName.trim(), forceOverwrite);
        if (result.success || result === true) {
          onDismiss();
        } else if (result.error === 'duplicate') {
          setShowConfirmOverwrite(true);
        } else {
          setError(result.message || 'Failed to save session');
        }
      } else if (action === 'load' && selectedSession) {
        const success = await onLoad(selectedSession);
        if (success) onDismiss();
        else setError('Failed to load session');
      }
    } catch (error) {
      console.error('Session operation failed:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverwriteConfirm = async () => {
    setShowConfirmOverwrite(false);
    await handleSubmit(true); // Force overwrite
  };

  const handleOverwriteCancel = () => {
    setShowConfirmOverwrite(false);
    setIsLoading(false);
  };

  const isDisabled = () => {
    if (isLoading) return true;
    if (action === 'save') return !sessionName.trim();
    if (action === 'load') return !selectedSession;
    return false;
  };

  const getButtonContent = () => {
    if (isLoading) {
      return [
        icon('loadingSpinner', {
          size: 16,
          style: { marginRight: '0.5rem', animation: 'spin 1s linear infinite' },
        }),
        action === 'save' ? 'Saving...' : 'Loading...',
      ];
    }
    return [action === 'save' ? 'Save' : 'Load'];
  };

  if (showConfirmOverwrite) {
    return h(
      Modal,
      {
        title: 'Confirm Overwrite',
        onDismiss: handleOverwriteCancel,
        okButton: h(ButtonPrimary, { onClick: handleOverwriteConfirm }, ['Overwrite']),
        cancelButton: h(ButtonSecondary, { onClick: handleOverwriteCancel }, ['Cancel']),
      },
      [
        div({ style: { marginBottom: '1rem' } }, [`A session named "${sessionName}" already exists. Do you want to overwrite it?`]),
        div({ style: { fontSize: '0.9rem', color: '#666' } }, ['This action cannot be undone.']),
      ]
    );
  }

  return h(
    Modal,
    {
      title: action === 'save' ? 'Save IGV Session' : 'Load IGV Session',
      onDismiss: isLoading ? undefined : onDismiss,
      okButton: h(
        ButtonPrimary,
        {
          disabled: isDisabled(),
          onClick: () => handleSubmit(false),
        },
        getButtonContent()
      ),
      cancelButton: h(
        ButtonSecondary,
        {
          onClick: onDismiss,
          disabled: isLoading,
        },
        ['Cancel']
      ),
    },
    [
      action === 'save'
        ? [
            div({ style: { marginBottom: '1rem' } }, ['Enter a name for this session:']),
            input({
              type: 'text',
              value: sessionName,
              onChange: (e) => {
                setSessionName(e.target.value);
                setError(null); // Clear error when typing
                // Show visual feedback if name exists
                if (checkForDuplicate(e.target.value.trim())) {
                  // Could add visual indication here
                }
              },
              placeholder: 'Session name...',
              style: { width: '100%', padding: '0.5rem' },
              disabled: isLoading,
            }),
            checkForDuplicate(sessionName.trim()) &&
              div(
                {
                  style: {
                    color: '#ff6b6b',
                    fontSize: '0.8rem',
                    marginTop: '0.5rem',
                  },
                },
                ['⚠️ A session with this name already exists']
              ),
          ]
        : [
            div({ style: { marginBottom: '1rem' } }, ['Select a session to load:']),
            div({ style: { maxHeight: '300px', overflowY: 'auto' } }, [
              savedSessions.length === 0
                ? div(['No saved sessions found'])
                : savedSessions.map((session) =>
                    div(
                      {
                        key: session.name,
                        style: {
                          padding: '0.5rem',
                          border: selectedSession === session.name ? '2px solid blue' : '1px solid #ccc',
                          marginBottom: '0.5rem',
                          cursor: 'pointer',
                        },
                        onClick: isLoading ? undefined : () => setSelectedSession(session.name),
                      },
                      [
                        div({ style: { fontWeight: 'bold' } }, [session.name]),
                        div({ style: { fontSize: '0.8rem', color: '#666' } }, [new Date(session.timestamp).toLocaleString()]),
                      ]
                    )
                  ),
            ]),
          ],
      error &&
        div(
          {
            style: {
              color: 'red',
              marginTop: '1rem',
              padding: '0.5rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
            },
          },
          [error]
        ),
    ]
  );
};

export default IGVSessionModal;
