import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { delay } from 'src/libs/utils';
import { buildStructBreadcrumbs, StructBuilder, StructBuilderModal } from 'src/workflows-app/components/StructBuilder';

describe('unit tests', () => {
  it('should build breadcrumbs given a struct path', () => {
    const inputType = {
      type: 'struct',
      name: 'Pet',
      fields: [
        {
          field_name: 'name',
          field_type: {
            type: 'primitive',
            primitive_type: 'String',
          },
        },
        {
          field_name: 'species',
          field_type: {
            type: 'struct',
            name: 'PetSpecies',
            fields: [
              {
                field_name: 'species_name',
                field_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              {
                field_name: 'breed_name',
                field_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              {
                field_name: 'breed_characteristics',
                field_type: {
                  type: 'struct',
                  name: 'Characteristics',
                  fields: [
                    {
                      field_name: 'temperament',
                      field_type: {
                        type: 'primitive',
                        primitive_type: 'String',
                      },
                    },
                    {
                      field_name: 'intelligence',
                      field_type: {
                        type: 'optional',
                        optional_type: {
                          type: 'primitive',
                          primitive_type: 'String',
                        },
                      },
                    },
                    {
                      field_name: 'good_with_kids',
                      field_type: {
                        type: 'primitive',
                        primitive_type: 'String',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };

    expect(buildStructBreadcrumbs([1], inputType)).toEqual(['species']);
    expect(buildStructBreadcrumbs([1, 1], inputType)).toEqual(['species', 'breed_name']);
    expect(buildStructBreadcrumbs([1, 2, 0], inputType)).toEqual(['species', 'breed_characteristics', 'temperament']);
  });
});

describe('Configuration tests', () => {
  const structType = {
    type: 'struct',
    name: 'Pet',
    fields: [
      {
        field_name: 'pet_age',
        field_type: { type: 'primitive', primitive_type: 'Int' },
      },
    ],
  };

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  it('when an input source is selected, and the source field is empty, adopt the name found in the corresponding type specification', async () => {
    // ** ARRANGE **
    const setStructSource = jest.fn();
    const setStructIndexPath = jest.fn();

    // ** ACT **
    render(
      h(StructBuilder, {
        structType,
        setStructSource,
        setStructIndexPath,
        structIndexPath: [],
        structName: 'myStruct',
        structSource: {
          type: 'object_builder',
          fields: [],
        },
        dataTableAttributes: {},
      })
    );

    // use the struct builder to set an input type, and attribute, and assert that the payload has all the required fields

    // ** ASSERT **
    const structTable = await screen.getByLabelText('struct-table');
    const structRows = within(structTable).queryAllByRole('row');
    expect(structRows.length).toBe(2);
    expect(setStructSource).toHaveBeenCalledTimes(0);

    const structCells = within(structRows[1]).queryAllByRole('cell');
    await userEvent.click(within(structCells[3]).getByText('Select Source'));
    const selectOption = await screen.findByText('Type a Value');
    await userEvent.click(selectOption);

    // upon selecting the source type of a previously empty source specification,
    // the struct builder source should adopt the `name` field given by the input type specification
    expect(setStructSource).toHaveBeenCalledTimes(1);
    expect(setStructSource).toHaveBeenCalledWith({
      type: 'object_builder',
      fields: [
        {
          name: 'pet_age',
          source: {
            parameter_value: '',
            type: 'literal',
          },
        },
      ],
    });
    expect(setStructIndexPath).not.toHaveBeenCalled();
  });

  it('when an input source is selected, and the source field has no name property, adopt the name found in the corresponding type specification', async () => {
    // ** ARRANGE **
    const setStructSource = jest.fn();
    const setStructIndexPath = jest.fn();

    // ** ACT **
    render(
      h(StructBuilder, {
        structType,
        setStructSource,
        setStructIndexPath,
        structIndexPath: [],
        structName: 'myStruct',
        structSource: {
          type: 'object_builder',
          fields: [
            {
              source: {
                parameter_value: '',
                type: 'literal',
              },
            },
          ],
        },
        dataTableAttributes: {},
      })
    );

    // ** ASSERT **
    const structTable = await screen.getByLabelText('struct-table');
    const structRows = within(structTable).queryAllByRole('row');
    expect(structRows.length).toBe(2);
    expect(setStructSource).toHaveBeenCalledTimes(0);

    const structCells = within(structRows[1]).queryAllByRole('cell');
    await userEvent.click(within(structCells[3]).getByText('Type a Value'));
    const selectOption = await screen.findByText('Fetch from Data Table');
    await userEvent.click(selectOption);

    // upon selecting the source type of a previously empty source specification,
    // the struct builder source should adopt the `name` field given by the input type specification
    expect(setStructSource).toHaveBeenCalledTimes(1);
    expect(setStructSource).toHaveBeenCalledWith({
      type: 'object_builder',
      fields: [
        {
          name: 'pet_age',
          source: {
            record_attribute: '',
            type: 'record_lookup',
          },
        },
      ],
    });
    expect(setStructIndexPath).not.toHaveBeenCalled();
  });

  const complexStructType = {
    type: 'struct',
    name: 'Pet',
    fields: [
      {
        field_name: 'pet_description',
        field_type: {
          name: 'pet_description',
          type: 'struct',
          fields: [
            {
              field_name: 'pet_num_legs',
              field_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
            },
            {
              field_name: 'pet_has_tail',
              field_type: {
                type: 'primitive',
                primitive_type: 'Boolean',
              },
            },
          ],
        },
      },
      {
        field_name: 'pet_age',
        field_type: { type: 'primitive', primitive_type: 'Int' },
      },
    ],
  };
  const complexStructSource = {
    type: 'object_builder',
    fields: [
      {
        source: {
          type: 'object_builder',
          fields: [
            {
              type: 'literal',
              parameter_value: 'foo',
            },
            {
              type: 'none',
            },
          ],
        },
      },
      {
        source: {
          type: 'none',
        },
      },
    ],
  };

  it('Clicking done moves up a level on inner structs and dismisses modal on outermost struct', async () => {
    const setStructSource = jest.fn();
    const onDismiss = jest.fn();

    // ** ACT **
    render(
      h(StructBuilderModal, {
        structType: complexStructType,
        setStructSource,
        onDismiss,
        structName: 'myStruct',
        structSource: complexStructSource,
        dataTableAttributes: {},
      })
    );

    // ** ASSERT **
    const structTable = await screen.getByLabelText('struct-table');
    const structRows = within(structTable).queryAllByRole('row');
    expect(structRows.length).toBe(3);
    within(structRows[1]).getByText('pet_age');
    within(structRows[2]).getByText('pet_description');

    const structCells = within(structRows[2]).queryAllByRole('cell');
    within(structCells[3]).getByText('Use Struct Builder');

    // ** ACT **
    // go into inner struct
    await userEvent.click(within(structCells[4]).getByText('View Struct'));

    // ** ASSERT **
    // should be in inner struct now
    const innerStructTable = await screen.getByLabelText('struct-table');
    const innerStructRows = within(innerStructTable).queryAllByRole('row');
    expect(innerStructRows.length).toBe(3);
    within(innerStructRows[1]).getByText('pet_has_tail');
    within(innerStructRows[2]).getByText('pet_num_legs');

    // ** ACT **
    // go back up a level by clicking 'Back'
    const innerDoneButton = await screen.getByText('Back');
    await userEvent.click(innerDoneButton);

    // ** ASSERT **
    // onDismiss hasn't been called, back to outer struct
    expect(onDismiss).not.toHaveBeenCalled();
    const outerStructTable = await screen.getByLabelText('struct-table');
    const outerStructRows = within(outerStructTable).queryAllByRole('row');
    expect(outerStructRows.length).toBe(3);
    within(outerStructRows[1]).getByText('pet_age');
    within(outerStructRows[2]).getByText('pet_description');

    // ** ACT **
    // exit modal by clicking 'Done'
    const outerDoneButton = await screen.getByText('Done');
    await userEvent.click(outerDoneButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('Searching in a struct filters the struct fields', async () => {
    // ** ARRANGE **
    const setStructSource = jest.fn();
    const setStructIndexPath = jest.fn();

    // ** ACT **
    render(
      h(StructBuilder, {
        structType: complexStructType,
        setStructSource,
        setStructIndexPath,
        structIndexPath: [],
        structName: 'myStruct',
        structSource: complexStructSource,
        dataTableAttributes: {},
      })
    );

    // ** ASSERT **
    const structTable = await screen.getByLabelText('struct-table');
    const structRows = within(structTable).queryAllByRole('row');
    expect(structRows.length).toBe(3);
    within(structRows[1]).getByText('pet_age');
    within(structRows[2]).getByText('pet_description');

    const searchInput = await screen.getByLabelText('Search inputs');
    await userEvent.type(searchInput, 'pet_a');
    expect(searchInput).toHaveValue('pet_a');
    await act(() => delay(300)); // debounced search

    const filteredStructRows = within(structTable).queryAllByRole('row');
    expect(filteredStructRows.length).toBe(2);
    within(filteredStructRows[1]).getByText('pet_age');

    await userEvent.type(searchInput, '{backspace}');
    expect(searchInput).toHaveValue('pet_');
    await act(() => delay(300)); // debounced search

    const allFilteredStructRows = within(structTable).queryAllByRole('row');
    expect(allFilteredStructRows.length).toBe(3);
    within(allFilteredStructRows[1]).getByText('pet_age');
    within(allFilteredStructRows[2]).getByText('pet_description');
  });
});
