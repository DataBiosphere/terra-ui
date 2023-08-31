import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import colors from 'src/libs/colors';
import { useStore } from 'src/libs/react-utils';
import { ajaxOverridesStore, configOverridesStore } from 'src/libs/state';

const ConfigOverridesWarning = () => {
  const configOverrides = useStore(configOverridesStore);
  const ajaxOverrides = useStore(ajaxOverridesStore);
  return (
    (!!configOverrides || ajaxOverrides.length > 0) &&
    div(
      {
        style: {
          position: 'fixed',
          bottom: 0,
          right: 0,
          color: 'white',
          backgroundColor: colors.accent(1.2),
          padding: '0.5rem',
        },
      },
      [
        !!configOverrides &&
          div(['Config overrides are in effect.', h(Link, { variant: 'light', onClick: () => configOverridesStore.set() }, [' clear'])]),
        ajaxOverrides.length > 0 &&
          div(['Ajax overrides are in effect.', h(Link, { variant: 'light', onClick: () => ajaxOverridesStore.set([]) }, [' clear'])]),
      ]
    )
  );
};

export default ConfigOverridesWarning;
