import debouncePromise from 'debounce-promise';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { AsyncCreatableSelect } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useInstance } from 'src/libs/react-utils';

export const WorkspaceTagSelect = (props) => {
  const signal = useCancellation();
  const getTagSuggestions = useInstance(() =>
    debouncePromise(
      withErrorReporting('Error loading tags')(async (text) => {
        return _.map(({ tag, count }) => {
          return { value: tag, label: `${tag} (${count})` };
        }, await Ajax(signal).Workspaces.getTags(text, 10));
      }),
      250
    )
  );
  return h(AsyncCreatableSelect, {
    allowCreateWhileLoading: true,
    defaultOptions: true,
    loadOptions: getTagSuggestions,
    ...props,
  });
};
