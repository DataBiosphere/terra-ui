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
}

const filterOptions: FilterOptions[] = [FilterOptions.Failed, FilterOptions.NoFilter, FilterOptions.Succeeded];

const FilterSubmissionsDropdown = ({ filterOption, setFilterOption }: FilterSubmissionsDropdownProps) => {
  return div([
    div([h3(['Filter by: '])]),
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
      styles: { container: (old) => ({ ...old, display: 'inline-block', width: 200, marginBottom: '1.5rem' }) },
      options: filterOptions,
    }),
  ]);
};

export default FilterSubmissionsDropdown;
