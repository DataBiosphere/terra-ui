import { Select } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Children, useCallback, useEffect, useRef } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { List } from 'react-virtualized';
import { AutoSizer } from 'src/components/common/VirtualizedSelectAutoSizer';
import { useOnMount } from 'src/libs/react-utils';

export { AsyncCreatableSelect, GroupedSelect, Select } from '@terra-ui-packages/components';
export type { SelectProps } from '@terra-ui-packages/components';

const VirtualizedMenuList = (props) => {
  const { children, focusedOption, getStyles, getValue, maxHeight } = props;

  const list = useRef<List>();

  const scrollToOptionForValue = useCallback(
    (value) => {
      const renderedOptions = Children.map(children, (child) => child.props.data);
      const valueIndex = renderedOptions.findIndex((opt) => opt.value === value);
      if (valueIndex !== -1) {
        list.current!.scrollToRow(valueIndex);
      }
    },
    [children]
  );

  // Scroll to the currently selected value (if there is one) when the menu is opened.
  useOnMount(() => {
    const [selectedOption] = getValue();
    if (selectedOption) {
      scrollToOptionForValue(selectedOption.value);
    }
  });

  // When navigating option with arrow keys, scroll the virtualized list so that the focused option is visible.
  useEffect(() => {
    if (focusedOption) {
      scrollToOptionForValue(focusedOption.value);
    }
  }, [children, focusedOption]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasRenderedOptions = Array.isArray(children);

  // If no options are rendered, then render the "no options" message.
  if (!hasRenderedOptions) {
    return children;
  }

  const rowCount = children.length;
  const rowHeight = 40;
  const height = _.clamp(rowHeight, maxHeight, rowHeight * rowCount);

  return h(AutoSizer, { disableHeight: true }, [
    ({ width }) => {
      // @ts-expect-error
      return h(List, {
        ref: list,
        height,
        width,
        rowCount,
        rowHeight,
        rowRenderer: ({ index, style, key }) => div({ key, style }, [children[index]]),
        style: { ...getStyles('menuList', props), boxSizing: 'content-box' },
      });
    },
  ]);
};

export const VirtualizedSelect = (props) => {
  return h(
    Select,
    _.merge(
      {
        // react-select performs poorly when it has to render hundreds or thousands of options.
        // This can happen for example in a workspace menu if the user has many workspaces.
        // To address that, this component virtualizes the list of options.
        // See https://broadworkbench.atlassian.net/browse/SUP-808 for more information.
        components: { MenuList: VirtualizedMenuList },
      },
      props
    )
  );
};
