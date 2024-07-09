import { div, h, h3 } from 'react-hyperscript-helpers';
import { Select } from 'src/components/common';

type FilterSubmissionsDropdownProps = {
  filterOption: FilterOptions | undefined;
  setFilterOption: (filterOption: FilterOptions) => void;
};

export enum FilterOptions {
  Failed = 'Failed',
  NoFilter = 'No filter',
  Succeeded = 'Succeeded',
  OwnSubmissions = 'Your submissions',
}

const filterOptions: FilterOptions[] = [
  FilterOptions.Failed,
  FilterOptions.NoFilter,
  FilterOptions.Succeeded,
  FilterOptions.OwnSubmissions,
];

const FilterSubmissionsDropdown = ({ filterOption, setFilterOption }: FilterSubmissionsDropdownProps) => {
  return div([
    div({ style: { display: 'flex', flexDirection: 'row' } }, [
      h3({ style: { marginRight: '1em', marginTop: 0 } }, ['Filter by:']),
      div({ style: { marginTop: '-0.5em' } }, [
        h(Select, {
          isDisabled: false,
          'aria-label': 'Filter selection',
          isClearable: false,
          value: filterOption,
          placeholder: 'None selected',
          // @ts-expect-error
          onChange: ({ value }) => {
            setFilterOption(value);
          },
          styles: {
            container: (old) => ({ ...old, display: 'inline-block', width: 200 /* , marginBottom: '1rem' */ }),
          },
          options: filterOptions,
        }),
      ]),
    ]),
  ]);
};

export default FilterSubmissionsDropdown;
