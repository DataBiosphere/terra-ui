import { getWorkflowInputSuggestionsForAttributesOfSetMembers } from 'src/libs/workflow-utils';

describe('getWorkflowInputSuggestionsForAttributesOfSetMembers', () => {
  it('returns workflow input expressions for attributes of entities reference by selected data', () => {
    expect(
      getWorkflowInputSuggestionsForAttributesOfSetMembers(
        [
          {
            attributes: {
              colors: {
                itemsType: 'EntityReference',
                items: [
                  {
                    entityType: 'color',
                    entityName: 'red',
                  },
                  {
                    entityType: 'color',
                    entityName: 'orange',
                  },
                  {
                    entityType: 'color',
                    entityName: 'yellow',
                  },
                  {
                    entityType: 'color',
                    entityName: 'green',
                  },
                  {
                    entityType: 'color',
                    entityName: 'blue',
                  },
                  {
                    entityType: 'color',
                    entityName: 'indigo',
                  },
                  {
                    entityType: 'color',
                    entityName: 'violet',
                  },
                ],
              },
            },
            entityType: 'palette',
            name: 'rainbow',
          },
        ],
        {
          palette: {
            attributeNames: ['colors'],
            count: 1,
            idName: 'id',
          },
          color: {
            attributeNames: ['hex', 'rgb'],
            count: 7,
            idName: 'name',
          },
        }
      )
    ).toEqual(['this.colors.hex', 'this.colors.name', 'this.colors.rgb']);
  });

  it('handles case where no data is selected', () => {
    expect(
      getWorkflowInputSuggestionsForAttributesOfSetMembers([], {
        row: {
          attributeNames: ['name', 'description'],
          count: 1,
          idName: 'id',
        },
      })
    ).toEqual([]);
  });

  it('handles case where selected data references no other entities', () => {
    expect(
      getWorkflowInputSuggestionsForAttributesOfSetMembers(
        [
          {
            attributes: {
              name: 'Row #1',
              description: 'an ordinary row',
            },
            entityType: 'row',
            name: 'row-1',
          },
        ],
        {
          row: {
            attributeNames: ['name', 'description'],
            count: 1,
            idName: 'id',
          },
        }
      )
    ).toEqual([]);
  });

  it('handles case where selected entities reference different entity types in the same attribute', () => {
    expect(
      getWorkflowInputSuggestionsForAttributesOfSetMembers(
        [
          {
            attributes: {
              issues: {
                itemsType: 'EntityReference',
                items: [
                  {
                    entityType: 'Bug',
                    entityName: 'bug-1',
                  },
                ],
              },
            },
            entityType: 'Sprint',
            name: 'sprint-1',
          },
          {
            attributes: {
              issues: {
                itemsType: 'EntityReference',
                items: [
                  {
                    entityType: 'Task',
                    entityName: 'task-1',
                  },
                ],
              },
            },
            entityType: 'Sprint',
            name: 'sprint-2',
          },
        ],
        {
          Sprint: {
            attributeNames: ['issues'],
            count: 2,
            idName: 'id',
          },
          Task: {
            attributeNames: ['description', 'priority'],
            count: 1,
            idName: 'id',
          },
          Bug: {
            attributeNames: ['description', 'severity'],
            count: 1,
            idName: 'id',
          },
        }
      )
    ).toEqual(['this.issues.description', 'this.issues.id', 'this.issues.priority', 'this.issues.severity']);
  });
});
