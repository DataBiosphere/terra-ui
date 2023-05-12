import _ from 'lodash/fp';
import { useEffect } from 'react';
import { div, h, h2, h3 } from 'react-hyperscript-helpers';
import { Select, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon } from 'src/components/icons';
import TopBar from 'src/components/TopBar';
import { DatasetBuilder, DatasetResponse } from 'src/libs/ajax/DatasetBuilder';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import colors from 'src/libs/colors';
import { useStore } from 'src/libs/react-utils';
import { datasetBuilderCohorts } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import {
  Cohort,
  Criteria,
  DomainCriteria,
  ProgramDataListCriteria,
  ProgramDataRangeCriteria,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { DatasetBuilderHeader } from 'src/pages/library/datasetBuilder/DatasetBuilder';

const PAGE_PADDING_HEIGHT = 0;
const PAGE_PADDING_WIDTH = 3;

const renderCriteria = (criteria: Criteria) =>
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
      div({ style: { display: 'flex' } }, [
        icon('minus-circle'),
        Utils.cond(
          [
            (criteria as DomainCriteria).category != null,
            () => {
              const domainCriteria = criteria as DomainCriteria;
              return div([`Domain: ${domainCriteria.category}: ${criteria.name}`]);
            },
          ],
          [
            (criteria as ProgramDataListCriteria).valueId != null,
            () => {
              const listCriteria = criteria as ProgramDataListCriteria;
              return div([`Program Data: ${criteria.name} Value: ${listCriteria.value}`]);
            },
          ],
          [
            (criteria as ProgramDataRangeCriteria).low != null,
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

const renderCohort = (cohort: Cohort | undefined) => {
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
                    padding: '1rem',
                    marginTop: index !== 0 ? '1rem' : undefined,
                    width: '47rem',
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
                      div({ style: { alignItems: 'middle' } }, [
                        `Group ${index + 1}`,
                        icon('ellipsis-v-circle', { size: 20 }),
                      ]),
                    ]
                  ),
                  div([
                    (criteriaGroup.criteria.length !== 0 && _.map(renderCriteria, criteriaGroup.criteria)) ||
                      div([
                        div({ style: { fontWeight: 'bold' } }, ['No criteria yet']),
                        div({ style: { fontStyle: 'italic' } }, [
                          "You can add a criteria by clicking on 'Add criteria'",
                        ]),
                      ]),
                  ]),
                  div({ style: { borderBottom: `2px solid ${colors.dark(0.35)}`, marginBottom: '2px' } }),
                  h(Select, {
                    isClearable: false,
                    isSearchable: false,
                    options: [
                      {
                        label: 'Domains',
                        options: _.map(
                          (value) => {
                            return { value };
                          },
                          ['Conditions', 'Procedures', 'Drugs', 'Measurements', 'Visits']
                        ),
                      },
                      {
                        label: 'Program Data',
                        options: _.map(
                          (value) => {
                            return { value };
                          },
                          ['Ethnicity', 'Gender identity', 'Race', 'Year of birth']
                        ),
                      },
                    ],
                    placeholder: 'Add criteria',
                    value: undefined,
                    onChange: () => {},
                  }),
                ]
              ),
            Utils.toIndexPairs(cohort.criteriaGroups)
          ),
        ]),
  ]);
};

const CohortEditorContents = ({ cohortName }) => {
  const cohorts: Cohort[] = useStore(datasetBuilderCohorts);
  return div({ style: { padding: `${PAGE_PADDING_HEIGHT}rem ${PAGE_PADDING_WIDTH}rem`, backgroundColor: '#E9ECEF' } }, [
    h2([icon('circle-chevron-left', { className: 'regular' }), cohortName]),
    h3(['To be included in the cohort, participants...']),
    div({ style: { display: 'flex' } }, [renderCohort(_.find((cohort) => cohort.name === cohortName, cohorts))]),
    // div({ style: { flex: 1 } }),
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
