import 'rc-slider/assets/index.css';

import _ from 'lodash/fp';
import Slider from 'rc-slider';
import React, { Fragment, useState } from 'react';
import { div, h, h2, h3, strong } from 'react-hyperscript-helpers';
import { ButtonOutline, ButtonPrimary, GroupedSelect, Link, Select } from 'src/components/common';
import { icon } from 'src/components/icons';
import { NumberInput } from 'src/components/input';
import {
  AnyCriteria,
  Cohort,
  CriteriaGroup,
  DatasetResponse,
  DomainOption,
  ProgramDataListCriteria,
  ProgramDataListOption,
  ProgramDataListValue,
  ProgramDataRangeCriteria,
  ProgramDataRangeOption,
} from 'src/libs/ajax/DatasetBuilder';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';
import { PAGE_PADDING_HEIGHT, PAGE_PADDING_WIDTH } from 'src/pages/library/datasetBuilder/constants';
import {
  domainCriteriaSelectorState,
  homepageState,
  newCriteriaGroup,
  Updater,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { OnStateChangeHandler } from 'src/pages/library/datasetBuilder/DatasetBuilder';

const flexWithBaseline = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
};

const narrowMargin = 5;
const wideMargin = 10;

type CriteriaViewProps = {
  criteria: AnyCriteria;
  deleteCriteria: (criteria: AnyCriteria) => void;
  updateCriteria: (criteria: AnyCriteria) => void;
};

const addCriteriaText = 'Add criteria';

export const CriteriaView = ({ criteria, deleteCriteria, updateCriteria }: CriteriaViewProps) =>
  div(
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
        div({ style: { marginLeft: narrowMargin, width: '25rem' } }, [
          (() => {
            switch (criteria.kind) {
              case 'domain':
                return h(Fragment, [strong([`${criteria.domainOption.category}:`]), ` ${criteria.name}`]);
              case 'list':
                return h(Fragment, [
                  strong([`${criteria.name}: ${_.flow(_.map('name'), _.join(', '))(criteria.values)}`]),
                  h(Select, {
                    'aria-label': `Select one or more ${criteria.name}`,
                    isClearable: true,
                    isMulti: true,
                    options: _.map(
                      (value) => ({
                        label: value.name,
                        value: value.id,
                      }),
                      criteria.listOption.values
                    ),
                    value: _.map('id', criteria.values),
                    onChange: (values) =>
                      _.flow(
                        _.set(
                          'values',
                          _.filter(
                            (value: ProgramDataListValue) => _.flow(_.map('value'), _.includes(value.id))(values),
                            criteria.listOption.values
                          )
                        ),
                        updateCriteria
                      )(criteria),
                  }),
                ]);
              case 'range':
                const numberInputStyles = {
                  width: '4rem',
                  padding: 0,
                  textAlign: 'center',
                };
                const rangeSliderMargin = 20;
                return h(Fragment, [
                  div([strong([`${criteria.name}:`]), ` ${criteria.low} - ${criteria.high}`]),
                  div({ style: { display: 'flex', alignItems: 'center' } }, [
                    h(NumberInput, {
                      min: criteria.rangeOption.min,
                      max: criteria.high,
                      isClearable: false,
                      onlyInteger: true,
                      value: criteria.low,
                      onChange: (v) => updateCriteria({ ...criteria, low: v }),
                      'aria-label': `${criteria.name} low`,
                      style: numberInputStyles,
                    }),
                    h(Slider, {
                      range: true,
                      value: [criteria.low, criteria.high],
                      min: criteria.rangeOption.min,
                      onChange: (values) => updateCriteria({ ...criteria, low: values[0], high: values[1] }),
                      max: criteria.rangeOption.max,
                      style: { marginLeft: rangeSliderMargin },
                      handleStyle: {
                        borderColor: colors.accent(),
                        backgroundColor: colors.accent(),
                        opacity: 1,
                        boxShadow: 'none',
                        height: 18,
                        width: 18,
                      },
                      trackStyle: { backgroundColor: colors.accent(0.5), height: 8 },
                      railStyle: { backgroundColor: colors.accent(0.4), height: 8 },
                      ariaLabelForHandle: [`${criteria.name} low slider`, `${criteria.name} high slider`],
                    }),
                    h(NumberInput, {
                      min: criteria.low,
                      max: criteria.rangeOption.max,
                      isClearable: false,
                      onlyInteger: true,
                      value: criteria.high,
                      onChange: (v) => updateCriteria({ ...criteria, high: v }),
                      'aria-label': `${criteria.name} high`,
                      style: { ...numberInputStyles, marginLeft: rangeSliderMargin },
                    }),
                  ]),
                ]);
              default:
                return div(['Unknown criteria']);
            }
          })(),
        ]),
      ]),
      `Count: ${criteria.count}`,
    ]
  );

let criteriaCount = 1;
const createDefaultListCriteria = (listOption: ProgramDataListOption): ProgramDataListCriteria => {
  return {
    kind: 'list',
    listOption,
    name: listOption.name,
    id: Number(_.uniqueId('')),
    count: 100,
    values: [listOption.values[0]],
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

export function criteriaFromOption(option: DomainOption): undefined;
export function criteriaFromOption(option: ProgramDataListOption): ProgramDataListCriteria;
export function criteriaFromOption(option: ProgramDataRangeOption): ProgramDataRangeCriteria;
export function criteriaFromOption(option: CriteriaOption): AnyCriteria;

export function criteriaFromOption(option: CriteriaOption): AnyCriteria | undefined {
  switch (option.kind) {
    case 'list':
      return createDefaultListCriteria(option);
    case 'range':
      return createDefaultRangeCriteria(option);
    case 'domain':
    default:
      return undefined;
  }
}

type AddCriteriaSelectorProps = {
  index: number;
  criteriaGroup: CriteriaGroup;
  updateCohort: Updater<Cohort>;
  datasetDetails: DatasetResponse;
  onStateChange: OnStateChangeHandler;
  cohort: Cohort;
};

const AddCriteriaSelector: React.FC<AddCriteriaSelectorProps> = (props) => {
  const { index, criteriaGroup, updateCohort, datasetDetails, onStateChange, cohort } = props;
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
    'aria-label': addCriteriaText,
    placeholder: addCriteriaText,
    value: null,
    onChange: (x) => {
      if (x !== null) {
        if (x.value.kind === 'domain') {
          onStateChange(domainCriteriaSelectorState.new(cohort, criteriaGroup, x.value));
        } else {
          const criteria = criteriaFromOption(x.value);
          if (criteria !== undefined) {
            updateCohort(_.set(`criteriaGroups.${index}.criteria.${criteriaGroup.criteria.length}`, criteria));
          }
        }
      }
    },
  });
};

type CriteriaGroupViewProps = {
  index: number;
  criteriaGroup: CriteriaGroup;
  updateCohort: Updater<Cohort>;
  cohort: Cohort;
  datasetDetails: DatasetResponse;
  onStateChange: OnStateChangeHandler;
};

export const CriteriaGroupView: React.FC<CriteriaGroupViewProps> = (props) => {
  const { index, criteriaGroup, updateCohort, cohort, datasetDetails, onStateChange } = props;

  const deleteCriteria = (criteria: AnyCriteria) =>
    updateCohort(_.set(`criteriaGroups.${index}.criteria`, _.without([criteria], criteriaGroup.criteria)));

  const updateCriteria = (criteria: AnyCriteria) => {
    updateCohort(
      _.set(
        `criteriaGroups.${index}.criteria.${_.findIndex({ id: criteria.id }, cohort.criteriaGroups[index].criteria)}`,
        criteria
      )
    );
  };

  return div(
    {
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
          criteriaGroup.criteria.length !== 0
            ? _.map(
                (criteria) =>
                  h(CriteriaView, {
                    deleteCriteria,
                    updateCriteria,
                    criteria,
                    key: criteria.id,
                  }),
                criteriaGroup.criteria
              )
            : div({ style: { marginTop: 15 } }, [
                div({ style: { fontWeight: 'bold', fontStyle: 'italic' } }, ['No criteria yet']),
                div({ style: { fontStyle: 'italic', marginTop: narrowMargin } }, [
                  `You can add a criteria by clicking on '${addCriteriaText}'`,
                ]),
              ]),
        ]),
        h(AddCriteriaSelector, { index, criteriaGroup, updateCohort, datasetDetails, onStateChange, cohort }),
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
  updateCohort: Updater<Cohort>;
  onStateChange: OnStateChangeHandler;
};
const CohortGroups: React.FC<CohortGroupsProps> = (props) => {
  const { datasetDetails, cohort, updateCohort, onStateChange } = props;
  return div({ style: { width: '47rem' } }, [
    cohort == null
      ? 'No cohort found'
      : div([
          _.map(
            ([index, criteriaGroup]) =>
              h(Fragment, { key: criteriaGroup.name }, [
                h(CriteriaGroupView, { index, criteriaGroup, updateCohort, cohort, datasetDetails, onStateChange }),
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
  updateCohort: Updater<Cohort>;
  cohort: Cohort;
  datasetDetails: DatasetResponse;
  onStateChange: OnStateChangeHandler;
};
const CohortEditorContents: React.FC<CohortEditorContentsProps> = (props) => {
  const { updateCohort, cohort, datasetDetails, onStateChange } = props;
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
              onStateChange(homepageState.new());
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
          onStateChange,
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
  readonly onStateChange: OnStateChangeHandler;
  readonly datasetDetails: DatasetResponse;
  readonly originalCohort: Cohort;
  readonly updateCohorts: Updater<Cohort[]>;
}

export const CohortEditor: React.FC<CohortEditorProps> = (props) => {
  const { onStateChange, datasetDetails, originalCohort, updateCohorts } = props;
  const [cohort, setCohort] = useState<Cohort>(originalCohort);
  const updateCohort = (updateCohort: (Cohort) => Cohort) => _.flow(updateCohort, setCohort)(cohort);

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
          padding: wideMargin,
        },
      },
      [
        h(
          ButtonPrimary,
          {
            onClick: () => {
              updateCohorts((cohorts) => {
                const index = _.findIndex((c) => _.equals(c.name, cohort.name), cohorts);
                return _.set(`[${index === -1 ? cohorts.length : index}]`, cohort, cohorts);
              });
              onStateChange(homepageState.new());
            },
          },
          ['Save cohort']
        ),
      ]
    ),
  ]);
};
