import _ from 'lodash/fp';
import React, { Fragment, useState } from 'react';
import { div, h, h2, h3, strong } from 'react-hyperscript-helpers';
import { ButtonOutline, ButtonPrimary, GroupedSelect, Link, Select } from 'src/components/common';
import { icon } from 'src/components/icons';
import {
  DatasetResponse,
  DomainOption,
  ProgramDataListOption,
  ProgramDataRangeOption,
} from 'src/libs/ajax/DatasetBuilder';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';
import { PAGE_PADDING_HEIGHT, PAGE_PADDING_WIDTH } from 'src/pages/library/datasetBuilder/constants';
import {
  AnyCriteria,
  Cohort,
  CriteriaGroup,
  DomainCriteria,
  homepageState,
  newCriteriaGroup,
  ProgramDataListCriteria,
  ProgramDataRangeCriteria,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { OnStateChangeHandler } from 'src/pages/library/datasetBuilder/DatasetBuilder';
import { datasetBuilderCohorts } from 'src/pages/library/datasetBuilder/state';

const flexWithBaseline = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
};

const narrowMargin = 5;
const wideMargin = 10;

type CriteriaViewProps = { criteria: AnyCriteria; deleteCriteria: (criteria: AnyCriteria) => void };

const CriteriaView = ({ criteria, deleteCriteria }: CriteriaViewProps) => {
  return div(
    {
      style: {
        ...flexWithBaseline,
        width: '100%',
        paddingBottom: narrowMargin,
        marginTop: wideMargin,
        marginBottom: narrowMargin,
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
          [icon('minus-circle-red', { size: 24, style: { color: colors.danger() } })]
        ),
        div({ style: { marginLeft: narrowMargin } }, [
          (() => {
            switch (criteria.kind) {
              case 'domain':
                return h(Fragment, [strong([`${criteria.domainOption.category}:`]), ` ${criteria.name}`]);
              case 'list':
                return h(Fragment, [strong([`${criteria.name}:`]), ` ${criteria.value.name}`]);
              case 'range':
                return h(Fragment, [strong([`${criteria.name}:`]), ` ${criteria.low} - ${criteria.high}`]);
              default:
                return div(['Unknown criteria']);
            }
          })(),
        ]),
      ]),
      `Count: ${criteria.count}`,
    ]
  );
};

export const createCriteriaViewComponent =
  (deleteCriteria: (criteria: AnyCriteria) => void) => (criteria: AnyCriteria) =>
    h(CriteriaView, { deleteCriteria, criteria, key: criteria.id });

let criteriaCount = 1;
const selectDomainCriteria = (domainOption: DomainOption): DomainCriteria => {
  // This needs to be replaced with a UI that lets users select the criteria they want from
  // the list of concepts for this domain.
  return {
    kind: 'domain',
    domainOption,
    name: domainOption.values[0],
    id: criteriaCount++,
    // Need to call the API service to get the count for the criteria.
    count: 100,
  };
};

const createDefaultListCriteria = (listOption: ProgramDataListOption): ProgramDataListCriteria => {
  return {
    kind: 'list',
    listOption,
    name: listOption.name,
    id: criteriaCount++,
    count: 100,
    value: listOption.values[0],
  };
};

const createDefaultRangeCriteria = (rangeOption: ProgramDataRangeOption): ProgramDataRangeCriteria => {
  return {
    kind: 'range',
    rangeOption,
    name: rangeOption.name,
    id: criteriaCount++,
    count: 100,
    low: rangeOption.min,
    high: rangeOption.max,
  };
};

type CriteriaOption = DomainOption | ProgramDataRangeOption | ProgramDataListOption;

export function criteriaFromOption(option: DomainOption): DomainCriteria;
export function criteriaFromOption(option: ProgramDataListOption): ProgramDataListCriteria;
export function criteriaFromOption(option: ProgramDataRangeOption): ProgramDataRangeCriteria;
export function criteriaFromOption(option: CriteriaOption): AnyCriteria;

export function criteriaFromOption(option: CriteriaOption): AnyCriteria {
  switch (option.kind) {
    case 'domain':
      return selectDomainCriteria(option);
    case 'list':
      return createDefaultListCriteria(option);
    case 'range':
      return createDefaultRangeCriteria(option);
    default:
      return {
        kind: 'domain',
        domainOption: { kind: 'domain', id: 0, category: 'unknown', values: [] },
        name: 'unknown',
        count: 0,
        id: 0,
      };
  }
}

type AddCriteriaSelectorProps = {
  index: number;
  criteriaGroup: CriteriaGroup;
  updateCohort: CohortUpdater;
  datasetDetails: DatasetResponse;
};

const AddCriteriaSelector: React.FC<AddCriteriaSelectorProps> = (props) => {
  const { index, criteriaGroup, updateCohort, datasetDetails } = props;
  return h(GroupedSelect<CriteriaOption>, {
    styles: { container: (provided) => ({ ...provided, width: '230px', marginTop: wideMargin }) },
    isClearable: false,
    isSearchable: false,
    options: [
      {
        label: 'Domains',
        options: _.map((domainOption) => {
          return {
            value: domainOption,
            label: domainOption.category,
          };
        }, datasetDetails.domainOptions),
      },
      {
        label: 'Program Data',
        options: _.map((programDataOption) => {
          return {
            value: programDataOption,
            label: programDataOption.name,
          };
        }, datasetDetails.programDataOptions),
      },
    ],
    'aria-label': 'add criteria',
    placeholder: 'Add criteria',
    value: null,
    onChange: (x) => {
      if (x !== null) {
        const criteria = criteriaFromOption(x.value);
        updateCohort(_.set(`criteriaGroups.${index}.criteria.${criteriaGroup.criteria.length}`, criteria));
      }
    },
  });
};

type CriteriaGroupViewProps = {
  index: number;
  criteriaGroup: CriteriaGroup;
  updateCohort: CohortUpdater;
  cohort: Cohort;
  datasetDetails: DatasetResponse;
};

export const CriteriaGroupView: React.FC<CriteriaGroupViewProps> = (props) => {
  const { index, criteriaGroup, updateCohort, cohort, datasetDetails } = props;
  return div(
    {
      // key: criteriaGroup.name,
      style: {
        backgroundColor: 'white',
        borderRadius: '5px',
        marginTop: narrowMargin,
        border: `1px solid ${colors.dark(0.35)}`,
      },
    },
    [
      div({ style: { padding: '1rem' } }, [
        div(
          {
            style: { ...flexWithBaseline, width: '100%' },
          },
          [
            div(
              {
                style: flexWithBaseline,
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
                  styles: { container: (provided) => ({ ...provided, style: { marginLeft: wideMargin } }) },
                  options: ['any', 'all'],
                  value: criteriaGroup.meetAll ? 'all' : 'any',
                  onChange: () => updateCohort(_.set(`criteriaGroups.${index}.meetAll`, !criteriaGroup.meetAll)),
                }),
                div({ style: { marginLeft: wideMargin } }, ['of the following criteria:']),
              ]
            ),
            div({ style: { alignItems: 'center', display: 'flex' } }, [
              strong({ style: { marginRight: narrowMargin, fontSize: 16 } }, [criteriaGroup.name]),
              h(
                Link,
                {
                  'aria-label': 'delete group',
                  onClick: () =>
                    updateCohort(_.set('criteriaGroups', _.without([criteriaGroup], cohort.criteriaGroups))),
                },
                [icon('trash-circle-filled', { size: 24 })]
              ),
            ]),
          ]
        ),
        div([
          (criteriaGroup.criteria.length !== 0 &&
            _.map(
              createCriteriaViewComponent((criteria: AnyCriteria) =>
                updateCohort(_.set(`criteriaGroups.${index}.criteria`, _.without([criteria], criteriaGroup.criteria)))
              ),
              criteriaGroup.criteria
            )) ||
            div({ style: { marginTop: 15 } }, [
              div({ style: { fontWeight: 'bold', fontStyle: 'italic' } }, ['No criteria yet']),
              div({ style: { fontStyle: 'italic', marginTop: narrowMargin } }, [
                "You can add a criteria by clicking on 'Add criteria'",
              ]),
            ]),
        ]),
        h(AddCriteriaSelector, { index, criteriaGroup, updateCohort, datasetDetails }),
      ]),
      div(
        {
          style: {
            paddingTop: narrowMargin,
            marginTop: wideMargin,
            marginBottom: wideMargin,
            borderTop: `1px solid ${colors.dark(0.35)}`,
            display: 'flex',
            justifyContent: 'flex-end',
            fontWeight: 'bold',
          },
        },
        [div({ style: { marginRight: wideMargin } }, [`Group count: ${criteriaGroup.count}`])]
      ),
    ]
  );
};

type CohortGroupsProps = {
  cohort: Cohort | undefined;
  datasetDetails: DatasetResponse;
  updateCohort: CohortUpdater;
};
const CohortGroups: React.FC<CohortGroupsProps> = (props) => {
  const { datasetDetails, cohort, updateCohort } = props;
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
                    style: { marginLeft: narrowMargin, flexGrow: 1, borderTop: `1px solid ${colors.dark(0.35)}` },
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
  onStateChangeHandler: OnStateChangeHandler;
};
const CohortEditorContents: React.FC<CohortEditorContentsProps> = (props) => {
  const { updateCohort, cohort, datasetDetails, onStateChangeHandler } = props;
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
              onStateChangeHandler(homepageState.new());
            },
            'aria-label': 'cancel',
          },
          [icon('left-circle-filled', { size: 32 })]
        ),
        div({ style: { marginLeft: 15 } }, [cohort.name]),
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
            style: { marginTop: wideMargin },
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
  onStateChangeHandler: OnStateChangeHandler;
  datasetDetails: DatasetResponse;
  originalCohort: Cohort;
}

type CohortUpdater = (updater: (cohort: Cohort) => Cohort) => void;

export const CohortEditor: React.FC<CohortEditorProps> = (props) => {
  const { onStateChangeHandler, datasetDetails, originalCohort } = props;
  const [cohort, setCohort] = useState<Cohort>(originalCohort);
  const updateCohort: CohortUpdater = (updateCohort: (Cohort) => Cohort) => _.flow(updateCohort, setCohort)(cohort);

  return h(Fragment, [
    h(CohortEditorContents, { updateCohort, cohort, datasetDetails, onStateChangeHandler }),
    // add div to cover page to footer
    div(
      {
        style: {
          display: 'flex',
          backgroundColor: editorBackgroundColor,
          alignItems: 'end',
          flexDirection: 'row-reverse',
          padding: wideMargin,
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
              onStateChangeHandler(homepageState.new());
            },
          },
          ['Save cohort']
        ),
      ]
    ),
  ]);
};
