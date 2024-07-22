import { ReactElement } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary } from 'src/components/common';

export const ACTION_BAR_HEIGHT = '5rem';

type ActionBarProps = {
  /** The prompt to display next to the action bar button. */
  prompt: string | ReactElement;
  /** The action bar button's label. */
  actionText: string | ReactElement;
  /** The onClick handler for the action bar button.  */
  onClick: () => void;
  /** An optional flag for whether the button is disabled */
  disabled?: boolean;
  /** An optional tooltip for the action button */
  tooltip?: string | ReactElement[] | false;
};

/**
 * A component that displays a prompt and an action button at the bottom of a page.
 */
export const ActionBar = (props: ActionBarProps) => {
  const { prompt, actionText, onClick, tooltip, disabled } = props;
  return div(
    {
      style: {
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        height: ACTION_BAR_HEIGHT,
        position: 'fixed',
        bottom: 0,
        backgroundColor: 'white',
        boxShadow: '0 0 4px 0 rgba(0,0,0,0.5)',
        alignItems: 'center',
        padding: '1rem 2rem',
      },
    },
    [
      div({ style: { display: 'flex', alignItems: 'center' } }, [prompt]),
      h(ButtonPrimary, { tooltip, disabled, style: { marginLeft: '2rem', borderRadius: 0 }, onClick }, [actionText]),
    ]
  );
};
