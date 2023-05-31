import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h, h2, h3, strong } from 'react-hyperscript-helpers';
import { ButtonOutline, ButtonPrimary, GroupedSelect, Link, Select } from 'src/components/common';
import { icon } from 'src/components/icons';
import {
  CriteriaType,
  DatasetResponse,
  DomainType,
  ProgramDataListType,
  ProgramDataRangeType,
} from 'src/libs/ajax/DatasetBuilder';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';
import {
  AnyCriteria,
  Cohort,
  Criteria,
  CriteriaGroup,
  DatasetBuilderState,
  DomainCriteria,
  newCriteriaGroup,
  ProgramDataListCriteria,
  ProgramDataRangeCriteria,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { HomepageState, OnStateChangeType } from 'src/pages/library/datasetBuilder/DatasetBuilder';
import { datasetBuilderCohorts } from 'src/pages/library/datasetBuilder/state';

const PAGE_PADDING_HEIGHT = 0;
const PAGE_PADDING_WIDTH = 3;

type CriteriaViewProps = { criteria: Criteria; deleteCriteria: (criteria: Criteria) => void };

const CriteriaView = ({ criteria, deleteCriteria }: CriteriaViewProps) => {
  return div(
    {
      style: {
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingBottom: 5,
        marginTop: 10,
        marginBottom: 5,
        borderBottom: `1px solid ${colors.dark(0.35)}`,
      },
    },
    [
      div({ style: { margin: '5px', display: 'flex', alignItems: 'center' } }, [
        h(
          Link,
          {
            'aria-label': 'delete criteria',
            onClick: () => {
              deleteCriteria(criteria);
            },
          },
          [icon('minus-circle', { size: 24, style: { color: colors.danger() } })]
        ),
        div({ style: { marginLeft: 5 } }, [
          Utils.cond(
            [
              'domainType' in criteria,
              () => {
                const domainCriteria = criteria as DomainCriteria;
                return h(Fragment, [strong([`${domainCriteria.domainType.category}:`]), ` ${domainCriteria.name}`]);
              },
            ],
            [
              'listType' in criteria,
              () => {
                const listCriteria = criteria as ProgramDataListCriteria;
                return h(Fragment, [strong([`${criteria.name}:`]), ` ${listCriteria.value.name}`]);
              },
            ],
            [
              'rangeType' in criteria,
              () => {
                const rangeCriteria = criteria as ProgramDataRangeCriteria;
                return h(Fragment, [strong([`${criteria.name}:`]), ` ${rangeCriteria.low} - ${rangeCriteria.high}`]);
              },
            ],
            [Utils.DEFAULT, () => div(['Unknown criteria type'])]
          ),
        ]),
      ]),
      `Count: ${criteria.count}`,
    ]
  );
};

const renderCriteriaView = (deleteCriteria: (criteria: Criteria) => void) => (criteria: Criteria) =>
  h(CriteriaView, { deleteCriteria, criteria, key: criteria.id });

let criteriaCount = 1;
const selectDomainCriteria = (domainType: DomainType): DomainCriteria => {
  // This needs to be replaced with a UI that lets users select the criteria they want from
  // the list of concepts for this domain.
  return {
    domainType,
    name: domainType.values[0],
    id: criteriaCount++,
    // Need to call the API service to get the count for this criteria.
    count: 100,
  };
};

const createDefaultListCriteria = (listType: ProgramDataListType): ProgramDataListCriteria => {
  return {
    listType,
    name: listType.name,
    id: criteriaCount++,
    count: 100,
    value: listType.values[0],
  };
};

const createDefaultRangeCriteria = (rangeType: ProgramDataRangeType): ProgramDataRangeCriteria => {
  return {
    rangeType,
    name: rangeType.name,
    id: criteriaCount++,
    count: 100,
    low: rangeType.min,
    high: rangeType.max,
  };
};

function createCriteriaFromType(type: CriteriaType): AnyCriteria {
  return (
    Utils.condTyped<AnyCriteria>(
      ['category' in type, () => selectDomainCriteria(type as DomainType)],
      ['values' in type, () => createDefaultListCriteria(type as ProgramDataListType)],
      ['min' in type, () => createDefaultRangeCriteria(type as ProgramDataRangeType)]
    ) ?? { domainType: { id: 0, category: 'unknown', values: [] }, name: 'unknown', count: 0, id: 0 }
  );
}

type CriteriaGroupViewProps = {
  index: number;
  criteriaGroup: CriteriaGroup;
  updateCohort: CohortUpdater;
  cohort: Cohort;
  datasetDetails: DatasetResponse;
};

const CriteriaGroupView = ({ index, criteriaGroup, updateCohort, cohort, datasetDetails }: CriteriaGroupViewProps) => {
  return div(
    {
      // key: criteriaGroup.name,
      style: {
        backgroundColor: 'white',
        borderRadius: '5px',
        marginTop: 5,
        border: `1px solid ${colors.dark(0.35)}`,
      },
    },
    [
      div({ style: { padding: '1rem' } }, [
        div(
          {
            style: {
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            },
          },
          [
            div(
              {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                },
              },
              [
                h(Select, {
                  'aria-label': 'must or must not meet',
                  options: ['Must', 'Must not'],
                  value: criteriaGroup.mustMeet ? 'Must' : 'Must not',
                  onChange: () => updateCohort(_.set(`criteriaGroups.${index}.mustMeet`, !criteriaGroup.mustMeet)),
                }),
                div({ style: { margin: '0 10px' } }, ['meet']),
                h(Select, {
                  'aria-label': 'all or any',
                  styles: { container: (provided) => ({ ...provided, style: { marginLeft: 10 } }) },
                  options: ['any', 'all'],
                  value: criteriaGroup.meetAll ? 'all' : 'any',
                  onChange: () => updateCohort(_.set(`criteriaGroups.${index}.meetAll`, !criteriaGroup.meetAll)),
                }),
                div({ style: { marginLeft: 10 } }, ['of the following criteria:']),
              ]
            ),
            div({ style: { alignItems: 'center', display: 'flex' } }, [
              strong({ style: { marginRight: 5, fontSize: 16 } }, [criteriaGroup.name]),
              h(
                Link,
                {
                  'aria-label': 'delete group',
                  onClick: () =>
                    updateCohort(_.set('criteriaGroups', _.without([criteriaGroup], cohort.criteriaGroups))),
                },
                [icon('trash')]
              ),
            ]),
          ]
        ),
        div([
          (criteriaGroup.criteria.length !== 0 &&
            _.map(
              renderCriteriaView((criteria: Criteria) =>
                updateCohort(_.set(`criteriaGroups.${index}.criteria`, _.without([criteria], criteriaGroup.criteria)))
              ),
              criteriaGroup.criteria
            )) ||
            div({ style: { marginTop: 15 } }, [
              div({ style: { fontWeight: 'bold', fontStyle: 'italic' } }, ['No criteria yet']),
              div({ style: { fontStyle: 'italic', marginTop: 5 } }, [
                "You can add a criteria by clicking on 'Add criteria'",
              ]),
            ]),
        ]),
        div({ style: { marginTop: 10 } }, [
          h(GroupedSelect<CriteriaType>, {
            styles: { container: (provided) => ({ ...provided, width: '230px' }) },
            isClearable: false,
            isSearchable: false,
            options: [
              {
                label: 'Domains',
                options: _.map((domainType) => {
                  return {
                    value: domainType,
                    label: domainType.category,
                  };
                }, datasetDetails.domainTypes),
              },
              {
                label: 'Program Data',
                options: _.map((programDataType) => {
                  return {
                    value: programDataType,
                    label: programDataType.name,
                  };
                }, datasetDetails.programDataTypes),
              },
            ],
            'aria-label': 'add criteria',
            placeholder: 'Add criteria',
            value: null,
            onChange: (x) => {
              if (x !== null) {
                const criteria = createCriteriaFromType(x.value);
                updateCohort(_.set(`criteriaGroups.${index}.criteria.${criteriaGroup.criteria.length}`, criteria));
              }
            },
          }),
        ]),
      ]),
      div(
        {
          style: {
            paddingTop: 5,
            marginTop: 10,
            marginBottom: 10,
            borderTop: `1px solid ${colors.dark(0.35)}`,
            display: 'flex',
            justifyContent: 'flex-end',
            fontWeight: 'bold',
          },
        },
        [div({ style: { marginRight: 10 } }, [`Group count: ${criteriaGroup.count}`])]
      ),
    ]
  );
};

type CohortGroupsProps = {
  cohort: Cohort | undefined;
  datasetDetails: DatasetResponse;
  updateCohort: CohortUpdater;
};
const CohortGroups = ({ datasetDetails, cohort, updateCohort }: CohortGroupsProps) => {
  return div({ style: { width: '47rem' } }, [
    cohort == null
      ? 'No cohort found'
      : div([
          _.map(
            ([index, criteriaGroup]) =>
              h(Fragment, { key: criteriaGroup.name }, [
                h(CriteriaGroupView, { index, criteriaGroup, updateCohort, cohort, datasetDetails }),
                div({ style: { marginTop: '1rem', display: 'flex', alignItems: 'center' } }, [
                  div(
                    {
                      style: {
                        height: 45,
                        width: 45,
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        border: `1px solid ${colors.dark(0.35)}`,
                        fontStyle: 'italic',
                      },
                    },
                    ['And']
                  ),
                  div({
                    style: { marginLeft: 5, flexGrow: 1, borderTop: `1px solid ${colors.dark(0.35)}` },
                  }),
                ]),
              ]),
            Utils.toIndexPairs(cohort.criteriaGroups)
          ),
        ]),
  ]);
};

const editorBackgroundColor = colors.light(0.7);

type CohortEditorContentsProps = {
  updateCohort: CohortUpdater;
  cohort: Cohort;
  datasetDetails: DatasetResponse;
  onStateChange: OnStateChangeType;
};
const CohortEditorContents = ({ updateCohort, cohort, datasetDetails, onStateChange }: CohortEditorContentsProps) => {
  return div(
    {
      style: { padding: `${PAGE_PADDING_HEIGHT}rem ${PAGE_PADDING_WIDTH}rem` },
    },
    [
      h2({ style: { display: 'flex', alignItems: 'center' } }, [
        h(
          Link,
          {
            onClick: () => {
              onStateChange(new HomepageState());
            },
            'aria-label': 'cancel',
          },
          [icon('circle-chevron-left', { size: 32, className: 'regular', style: { marginRight: 5 } })]
        ),
        cohort.name,
      ]),
      h3(['To be included in the cohort, participants...']),
      div({ style: { display: 'flow' } }, [
        h(CohortGroups, {
          key: cohort.name,
          datasetDetails,
          cohort,
          updateCohort,
        }),
        h(
          ButtonOutline,
          {
            style: { marginTop: 10 },
            onClick: (e) => {
              updateCohort(_.set(`criteriaGroups.${cohort.criteriaGroups.length}`, newCriteriaGroup()));
              // Lose button focus, since button moves out from under the user's cursor.
              e.currentTarget.blur();
            },
          },
          ['Add group']
        ),
      ]),
    ]
  );
};

interface CohortEditorProps {
  onStateChange: OnStateChangeType;
  datasetDetails: DatasetResponse;
  originalCohort: Cohort;
}

type CohortUpdater = (updater: (cohort: Cohort) => Cohort) => void;

export const CohortEditor = ({ onStateChange, datasetDetails, originalCohort }: CohortEditorProps) => {
  const [cohort, setCohort] = useState(originalCohort);
  const updateCohort: CohortUpdater = (updateCohort: (Cohort) => Cohort) => {
    _.flow(updateCohort, setCohort)(cohort);
  };

  return h(Fragment, [
    h(CohortEditorContents, { updateCohort, cohort, datasetDetails, onStateChange }),
    // add div to cover page to footer
    div(
      {
        style: {
          display: 'flex',
          backgroundColor: editorBackgroundColor,
          alignItems: 'end',
          flexDirection: 'row-reverse',
          padding: 10,
        },
      },
      [
        h(
          ButtonPrimary,
          {
            onClick: () => {
              const cohorts: Cohort[] = datasetBuilderCohorts.get();
              const cohortIndex = _.findIndex((c) => _.equals(c, originalCohort), cohorts);
              datasetBuilderCohorts.set(
                _.set(`[${cohortIndex === -1 ? cohorts.length : cohortIndex}]`, cohort, cohorts)
              );
              onStateChange({ type: 'homepage' });
            },
          },
          ['Save cohort']
        ),
      ]
    ),
  ]);
};

export class CohortEditorState implements DatasetBuilderState {
  get type(): 'cohort-editor' {
    return 'cohort-editor';
  }

  readonly cohort: Cohort;

  public constructor(cohort: Cohort) {
    this.cohort = cohort;
  }
}
