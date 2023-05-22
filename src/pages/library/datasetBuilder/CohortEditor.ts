import _ from 'lodash/fp';
import { Fragment, useEffect } from 'react';
import { div, h, h2, h3 } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link, Select, spinnerOverlay } from 'src/components/common';
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
  CriteriaGroup,
  DomainCriteria,
  DomainType,
  ProgramDataListCriteria,
  ProgramDataListType,
  ProgramDataRangeCriteria,
  ProgramDataRangeType,
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
              return div([`${domainCriteria.category}: ${criteria.name}`]);
            },
          ],
          [
            'valueId' in criteria,
            () => {
              const listCriteria = criteria as ProgramDataListCriteria;
              return div([`${criteria.name}: ${listCriteria.value}`]);
            },
          ],
          [
            'low' in criteria,
            () => {
              const rangeCriteria = criteria as ProgramDataRangeCriteria;
              return div([`${criteria.name}: ${rangeCriteria.low} - ${rangeCriteria.high}`]);
            },
          ],
          [Utils.DEFAULT, () => div(['Unknown criteria type'])]
        ),
      ]),
      `Count: ${criteria.count}`,
    ]
  );

function createCriteriaFromType(
  type: DomainType | ProgramDataRangeType | ProgramDataListType
): DomainCriteria | ProgramDataRangeCriteria | ProgramDataListCriteria {
  return (
    Utils.condTyped<DomainCriteria | ProgramDataRangeCriteria | ProgramDataListCriteria>(
      [
        'category' in type,
        () => {
          const domainType = type as DomainType;
          return { name: domainType.values[0], id: domainType.id, category: domainType.category, count: 0 };
        },
      ],
      [
        'values' in type,
        () => {
          const listType = type as ProgramDataListType;
          return { name: listType.name, id: listType.id, count: 0, valueId: 0, value: listType.values[0] };
        },
      ],
      [
        'min' in type,
        () => {
          const rangeType = type as ProgramDataRangeType;
          return { name: rangeType.name, id: rangeType.id, count: 0, low: rangeType.min, high: rangeType.max };
        },
      ]
    ) || { category: 'unknown', name: 'unknown', count: 0, id: 0 }
  );
}

const CriteriaGroupView = ({
  index,
  criteriaGroup,
  updateCohort,
  cohort,
  datasetDetails,
}: {
  index: number;
  criteriaGroup: CriteriaGroup;
  updateCohort: (cohort: Cohort) => void;
  cohort: Cohort;
  datasetDetails: DatasetResponse;
}) => {
  return div(
    {
      style: {
        backgroundColor: 'white',
        width: '47rem',
        borderRadius: '5px',
        border: `1px solid ${colors.dark(0.35)}`,
      },
    },
    [
      div(
        {
          style: {
            padding: '1rem',
            marginTop: '1rem',
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
                    onChange: () =>
                      _.flow(_.set(`criteriaGroups.${index}.mustMeet`, !criteriaGroup.mustMeet), updateCohort)(cohort),
                  }),
                  div(['meet']),
                  h(Select, {
                    options: ['any', 'all'],
                    value: criteriaGroup.meetAll ? 'all' : 'any',
                    onChange: () =>
                      _.flow(_.set(`criteriaGroups.${index}.meetAll`, !criteriaGroup.meetAll), updateCohort)(cohort),
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
                    _.set(`criteriaGroups.${index}.criteria`, _.without([criteria], criteriaGroup.criteria)),
                    updateCohort
                  )(cohort);
                }),
                criteriaGroup.criteria
              )) ||
              div([
                div({ style: { fontWeight: 'bold' } }, ['No criteria yet']),
                div({ style: { fontStyle: 'italic' } }, ["You can add a criteria by clicking on 'Add criteria'"]),
              ]),
          ]),
          div([
            h(Select, {
              styles: { container: (provided) => ({ ...provided, width: '205px' }) },
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
              placeholder: 'Add criteria',
              value: undefined,
              onChange: (x) => {
                // FIXME: remove any
                const criteria = createCriteriaFromType((x as any).value);
                _.flow(
                  _.set(`criteriaGroups.${index}.criteria.${criteriaGroup.criteria.length}`, criteria),
                  updateCohort
                )(cohort);
              },
            }),
          ]),
        ]
      ),
      div(
        {
          style: {
            paddingTop: 5,
            marginTop: 5,
            borderTop: `1px solid ${colors.dark(0.35)}`,
            display: 'flex',
            justifyContent: 'flex-end',
            fontWeight: 'bold',
          },
        },
        [`Group count: ${criteriaGroup.count}`]
      ),
    ]
  );
};

const RenderCohort = ({
  datasetDetails,
  cohort,
  updateCohort,
}: {
  cohort: Cohort | undefined;
  datasetDetails: DatasetResponse;
  updateCohort: (cohort: Cohort) => void;
}) => {
  return div([
    cohort == null
      ? 'No cohort found'
      : div([
          _.map(
            ([index, criteriaGroup]) =>
              h(Fragment, [
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

function createCriteriaGroup(): CriteriaGroup {
  return {
    criteria: [],
    mustMeet: true,
    meetAll: true,
    count: 0,
  };
}

const CohortEditorContents = ({ cohortName, datasetDetails }) => {
  const cohorts: Cohort[] = useStore(datasetBuilderCohorts);
  const cohortIndex = _.findIndex((cohort) => cohort.name === cohortName, cohorts);
  const cohort = cohorts[cohortIndex];

  // Possibly make this accept a function to update the cohort, to avoid having to pass the cohort around.
  const updateCohort = (updatedCohort) => {
    datasetBuilderCohorts.set(_.set(`[${cohortIndex}]`, updatedCohort, cohorts));
  };

  return div({ style: { padding: `${PAGE_PADDING_HEIGHT}rem ${PAGE_PADDING_WIDTH}rem`, backgroundColor: '#E9ECEF' } }, [
    h2([icon('circle-chevron-left', { size: 32, className: 'regular' }), cohortName]),
    h3(['To be included in the cohort, participants...']),
    div({ style: { display: 'flow' } }, [
      h(RenderCohort, {
        datasetDetails,
        cohort,
        updateCohort,
      }),
      h(
        ButtonPrimary,
        {
          onClick: () =>
            _.flow(
              _.set(`criteriaGroups.${cohort.criteriaGroups.length}`, createCriteriaGroup()),
              updateCohort
            )(cohort),
        },
        ['Add group']
      ),
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
    // loadDatasetDetails changes on each render, so cannot depend on it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return datasetDetails.status === 'Ready'
    ? h(FooterWrapper, {}, [
        h(TopBar, { title: 'Preview', href: '' }, []),
        h(DatasetBuilderHeader, { name: datasetDetails.state.name }),
        h(CohortEditorContents, { cohortName, datasetDetails: datasetDetails.state }),
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
