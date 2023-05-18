import _ from 'lodash/fp';
import { useEffect } from 'react';
import { div, h, h2, h3 } from 'react-hyperscript-helpers';
import { Link, Select, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon } from 'src/components/icons';
import TopBar from 'src/components/TopBar';
import { DatasetBuilder, DatasetResponse } from 'src/libs/ajax/DatasetBuilder';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import colors from 'src/libs/colors';
import { useStore } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import {
  Cohort,
  Criteria,
  DomainCriteria,
  ProgramDataListCriteria,
  ProgramDataRangeCriteria,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { DatasetBuilderHeader } from 'src/pages/library/datasetBuilder/DatasetBuilder';
import { datasetBuilderCohorts } from 'src/pages/library/datasetBuilder/state';

const PAGE_PADDING_HEIGHT = 0;
const PAGE_PADDING_WIDTH = 3;

const renderCriteria = (deleteCriteria: (criteria) => void) => (criteria: Criteria) =>
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
      div({ style: { margin: '5px', display: 'flex', alignItems: 'center' } }, [
        h(
          Link,
          {
            onClick: () => {
              deleteCriteria(criteria);
            },
          },
          [icon('minus-circle', { size: 24, style: { color: colors.danger() } })]
        ),
        Utils.cond(
          [
            'category' in criteria,
            () => {
              const domainCriteria = criteria as DomainCriteria;
              return div([`Domain: ${domainCriteria.category}: ${criteria.name}`]);
            },
          ],
          [
            'valueId' in criteria,
            () => {
              const listCriteria = criteria as ProgramDataListCriteria;
              return div([`Program Data: ${criteria.name} Value: ${listCriteria.value}`]);
            },
          ],
          [
            'low' in criteria,
            () => {
              const rangeCriteria = criteria as ProgramDataRangeCriteria;
              return div([`Program Data: ${criteria.name} Value: ${rangeCriteria.low} - ${rangeCriteria.high}`]);
            },
          ],
          [Utils.DEFAULT, () => div(['Unknown criteria type'])]
        ),
      ]),
      `Count: ${criteria.count}`,
    ]
  );

const renderCohort = (cohort: Cohort | undefined, updateCohort: (cohort: Cohort) => void) => {
  return div([
    cohort == null
      ? 'No cohort found'
      : div([
          _.map(
            ([index, criteriaGroup]) =>
              div(
                {
                  style: {
                    backgroundColor: 'white',
                    width: '47rem',
                  },
                },
                [
                  div(
                    {
                      style: {
                        padding: '1rem',
                        marginTop: index !== 0 ? '1rem' : undefined,
                      },
                    },
                    [
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
                                options: ['Must', 'Must not'],
                                value: criteriaGroup.mustMeet ? 'Must' : 'Must not',
                                onChange: () => {},
                              }),
                              div(['meet']),
                              h(Select, {
                                options: ['any', 'all'],
                                value: criteriaGroup.meetAll ? 'all' : 'any',
                                onChange: () => {},
                              }),
                              div(['of the following criteria:']),
                            ]
                          ),
                          div({ style: { alignItems: 'center', display: 'flex' } }, [
                            `Group ${index + 1}`,
                            icon('ellipsis-v-circle', { size: 32 }),
                          ]),
                        ]
                      ),
                      div([
                        (criteriaGroup.criteria.length !== 0 &&
                          _.map(
                            renderCriteria((criteria: Criteria) => {
                              _.flow(
                                _.set(
                                  `criteriaGroups.${index}.criteria`,
                                  _.without([criteria], criteriaGroup.criteria)
                                ),
                                updateCohort
                              )(cohort);
                            }),
                            criteriaGroup.criteria
                          )) ||
                          div([
                            div({ style: { fontWeight: 'bold' } }, ['No criteria yet']),
                            div({ style: { fontStyle: 'italic' } }, [
                              "You can add a criteria by clicking on 'Add criteria'",
                            ]),
                          ]),
                      ]),
                      div({ style: { margin: '5px 0px', borderBottom: `1px solid ${colors.dark(0.35)}` } }),
                      h(Select, {
                        isClearable: false,
                        isSearchable: false,
                        options: [
                          {
                            label: 'Domains',
                            options: _.map(
                              (value) => {
                                return {
                                  value: { category: value, name: 'condition', id: 0, count: 10 } as DomainCriteria,
                                  label: value,
                                };
                              },
                              ['Conditions', 'Procedures', 'Drugs', 'Measurements', 'Visits']
                            ),
                          },
                          {
                            label: 'Program Data',
                            options: _.map(
                              (value) => {
                                return {
                                  value: {
                                    name: value,
                                    id: 0,
                                    count: 10,
                                    valueId: 0,
                                    value: 'something',
                                  } as ProgramDataListCriteria,
                                  label: value,
                                };
                              },
                              ['Ethnicity', 'Gender identity', 'Race', 'Year of birth']
                            ),
                          },
                        ],
                        placeholder: 'Add criteria',
                        value: undefined,
                        onChange: (value) => {
                          _.flow(
                            _.set(`criteriaGroups.${index}.criteria.${criteriaGroup.criteria.length}`, value),
                            updateCohort
                          )(cohort);
                        },
                      }),
                    ]
                  ),
                  // make this part of the group count div
                  div({
                    style: { margin: '5px 0px', borderBottom: `1px solid ${colors.dark(0.35)}` },
                  }),
                  div({ style: { display: 'flex', justifyContent: 'flex-end', fontWeight: 'bold' } }, [
                    `Group count: ${criteriaGroup.count}`,
                  ]),
                ]
              ),
            Utils.toIndexPairs(cohort.criteriaGroups)
          ),
        ]),
  ]);
};

const CohortEditorContents = ({ cohortName }) => {
  const cohorts: Cohort[] = useStore(datasetBuilderCohorts);
  const cohortIndex = _.findIndex((cohort) => cohort.name === cohortName, cohorts);
  return div({ style: { padding: `${PAGE_PADDING_HEIGHT}rem ${PAGE_PADDING_WIDTH}rem`, backgroundColor: '#E9ECEF' } }, [
    h2([icon('circle-chevron-left', { className: 'regular' }), cohortName]),
    h3(['To be included in the cohort, participants...']),
    div({ style: { display: 'flex' } }, [
      renderCohort(cohorts[cohortIndex], (cohort) => {
        datasetBuilderCohorts.set(_.set(`[${cohortIndex}]`, cohort, cohorts));
      }),
    ]),
  ]);
};

interface CohortEditorProps {
  datasetId: string;
  cohortName: string;
}

export const CohortEditorView = ({ datasetId, cohortName }: CohortEditorProps) => {
  const [datasetDetails, loadDatasetDetails] = useLoadedData<DatasetResponse>();
  useEffect(
    () => {
      loadDatasetDetails(() => DatasetBuilder().retrieveDataset(datasetId));
    },
    // loadWdlData changes on each render, so cannot depend on it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return datasetDetails.status === 'Ready'
    ? h(FooterWrapper, {}, [
        h(TopBar, { title: 'Preview', href: '' }, []),
        h(DatasetBuilderHeader, { name: datasetDetails.state.name }),
        h(CohortEditorContents, { cohortName }),
      ])
    : spinnerOverlay;
};

export const navPaths = [
  {
    name: 'edit-cohort',
    path: '/library/builder/:datasetId/cohort/:cohortName',
    component: CohortEditorView,
    title: 'Edit Dataset Cohort',
  },
];
