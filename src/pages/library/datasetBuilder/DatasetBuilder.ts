import * as _ from 'lodash/fp';
import React, { Fragment, useEffect, useState } from 'react';
import { div, h, h1, h2, h3, label } from 'react-hyperscript-helpers';
import { ButtonPrimary, Clickable, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon } from 'src/components/icons';
import Modal from 'src/components/Modal';
import TopBar from 'src/components/TopBar';
import { DatasetBuilder, DatasetResponse } from 'src/libs/ajax/DatasetBuilder';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { datasetBuilderCohorts, datasetBuilderConceptSets } from 'src/libs/state';
import { StringInput } from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs';
import { Cohort, ConceptSet, DatasetBuilderType } from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { validate } from 'validate.js';

const PAGE_PADDING_HEIGHT = 0;
const PAGE_PADDING_WIDTH = 3;

const DatasetBuilderSelectorSubHeader = ({ key, children }) =>
  div({ style: { fontSize: 12, fontWeight: 600 }, key }, children);

interface ValuesSet<T extends DatasetBuilderType> {
  header: string;
  values: T[];
}

interface DatasetBuilderSelectorProps<T extends DatasetBuilderType> {
  number: number;
  header: string;
  subheader?: string;
  valuesSets: ValuesSet<T>[];
  selectedValuesSets: ValuesSet<T>[];
  onChange: (newValuesSets: ValuesSet<T>[]) => void;
  headerAction: any;
  placeholder?: any;
  width?: string | number;
  maxWidth?: number;
}
const DatasetBuilderSelector = <T extends DatasetBuilderType>({
  number,
  header,
  subheader,
  headerAction,
  placeholder,
  valuesSets,
  onChange,
  selectedValuesSets,
  width = '30%',
}: DatasetBuilderSelectorProps<T>) => {
  return div({ style: { width, marginTop: '1rem' } }, [
    div({ style: { display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' } }, [
      div({ style: { display: 'flex' } }, [
        div(
          {
            style: {
              backgroundColor: colors.accent(0.4),
              color: colors.dark(),
              padding: '0.5rem',
              borderRadius: '2rem',
              fontSize: 14,
              height: 24,
              width: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            },
          },
          [number]
        ),
        div({ style: { marginLeft: 10, height: '3rem' } }, [
          h3({ style: { marginTop: 0, marginBottom: '0.5rem' } }, [header]),
          div({ style: { fontSize: 12 } }, [subheader]),
        ]),
      ]),
      headerAction,
    ]),
    div(
      {
        style: {
          backgroundColor: 'white',
          border: `1px solid ${colors.dark(0.5)}`,
          borderRadius: 10,
          height: 300,
          padding: '1rem',
          marginTop: '0.5rem',
        },
      },
      [
        valuesSets && valuesSets.length > 0
          ? div(
              { style: { display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' } },
              _.map(
                (valuesSet, i) =>
                  valuesSet.values.length > 0 &&
                  h(Fragment, [
                    h(DatasetBuilderSelectorSubHeader, { key: i }, [valuesSet.header]),
                    _.map(
                      (value, j) =>
                        div(
                          {
                            style: {
                              display: 'flex',
                              padding: '0.5rem',
                              border: `1px solid ${colors.light()}`,
                              width: '100%',
                              marginTop: '0.3rem',
                              fontSize: 13,
                            },
                            key: j,
                          },
                          [
                            h(
                              LabeledCheckbox,
                              {
                                checked: _.flow(
                                  _.filter(
                                    (selectedValuesSet: ValuesSet<T>) => selectedValuesSet.header === valuesSet.header
                                  ),
                                  _.flatMap((selectedValuesSet: ValuesSet<T>) => selectedValuesSet.values),
                                  _.map((selectedValue) => selectedValue.name),
                                  _.includes(value.name)
                                )(selectedValuesSets),
                                onChange: () => {
                                  const index = _.findIndex(
                                    (selectedValuesSet) => selectedValuesSet.header === valuesSet.header,
                                    selectedValuesSets
                                  );

                                  onChange(
                                    index === -1
                                      ? selectedValuesSets.concat({ header: valuesSet.header, values: [value] })
                                      : _.set(
                                          `[${index}].values`,
                                          _.xorWith(_.isEqual, selectedValuesSets[index].values, [value]),
                                          selectedValuesSets
                                        )
                                  );
                                },
                              },
                              [label({ style: { paddingLeft: '0.5rem' } }, [value.name])]
                            ),
                          ]
                        ),
                      valuesSet.values
                    ),
                  ]),
                valuesSets
              )
            )
          : div([placeholder]),
      ]
    ),
  ]);
};

const CohortSelector = ({
  selectedCohorts,
  onChange,
}: {
  selectedCohorts: ValuesSet<Cohort>[];
  onChange: (cohorts: ValuesSet<Cohort>[]) => void;
}) => {
  const [creatingCohort, setCreatingCohort] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [cohortNameTouched, setCohortNameTouched] = useState(false);

  const errors = cohortNameTouched && validate({ cohortName }, { cohortName: { presence: { allowEmpty: false } } });

  const createCohort = (cohortName) => {
    // TODO: implement create cohort (push to global state and navigate to cohort edit page)
    datasetBuilderCohorts.set(datasetBuilderCohorts.get().concat({ name: cohortName }));
  };

  return h(Fragment, [
    h(DatasetBuilderSelector as React.FC<DatasetBuilderSelectorProps<Cohort>>, {
      headerAction: h(
        Clickable,
        {
          onClick: () => setCreatingCohort(true),
          'aria-label': 'Create new cohort',
          'aria-haspopup': 'dialog',
        },
        [icon('plus-circle', { size: 24 })]
      ),
      number: 1,
      // TODO: Implement cohort selection logic
      onChange,
      valuesSets: [
        {
          values: datasetBuilderCohorts.get(),
          header: 'Saved cohorts',
        },
      ],
      selectedValuesSets: selectedCohorts,
      header: 'Select cohorts',
      subheader: 'Which participants to include',
      placeholder: div([
        h(DatasetBuilderSelectorSubHeader, ['No cohorts yet']),
        div(["Create a cohort by clicking on the '+' icon"]),
      ]),
    }),
    creatingCohort &&
      h(
        Modal,
        {
          onDismiss: () => {
            setCohortName('');
            setCohortNameTouched(false);
            setCreatingCohort(false);
          },
          title: 'Create a new cohort',
          okButton: h(
            ButtonPrimary,
            { onClick: () => createCohort(cohortName), disabled: !cohortNameTouched || (errors && errors.cohortName) },
            ['Create cohort']
          ),
        },
        [
          h(StringInput, {
            title: 'Cohort name',
            onChange: (value) => {
              !cohortNameTouched && setCohortNameTouched(true);
              setCohortName(value);
            },
            value: cohortName,
            errors: errors && errors.cohortName,
            placeholder: 'Enter the cohort name',
            required: true,
          }),
        ]
      ),
  ]);
};

const ConceptSetSelector = ({
  selectedConceptSets,
  onChange,
}: {
  selectedConceptSets: ValuesSet<ConceptSet>[];
  onChange: (conceptSets: ValuesSet<ConceptSet>[]) => void;
}) => {
  return h(DatasetBuilderSelector as React.FC<DatasetBuilderSelectorProps<ConceptSet>>, {
    headerAction: h(
      Link,
      {
        // TODO: Point at correct link
        href: Nav.getLink('root'),
        'aria-label': 'Create new concept set',
        style: { color: colors.dark() },
      },
      [icon('plus-circle', { size: 24 })]
    ),
    number: 2,
    onChange,
    valuesSets: [
      {
        header: 'Concept sets',
        values: datasetBuilderConceptSets.get(),
      },
      {
        header: 'Prepackaged concept sets',
        values: [{ name: 'Demographics' }, { name: 'All surveys' }],
      },
    ],
    selectedValuesSets: selectedConceptSets,
    header: 'Select concept sets',
    subheader: 'Which information to include about participants',
    // TODO: Include prepackaged concept sets
  });
};

type Value = DatasetBuilderType;
const ValuesSelector = ({
  selectedValues,
  onChange,
}: {
  selectedValues: ValuesSet<Value>[];
  onChange: (values: ValuesSet<Value>[]) => void;
}) => {
  return h(DatasetBuilderSelector as React.FC<DatasetBuilderSelectorProps<Value>>, {
    // TODO: Implement select all logic
    headerAction: div(['Select All']),
    number: 3,
    onChange,
    valuesSets: [],
    selectedValuesSets: selectedValues,
    header: 'Select values (columns)',
    placeholder: div([
      div(['No inputs selected']),
      div(['You can view the available values by selecting at least one cohort and concept set']),
    ]),
    width: '40%',
  });
};

const DatasetBuilderHeader = ({ name }: { name: string }) => {
  return div(
    { style: { borderBottom: '1px solid black', padding: `${PAGE_PADDING_HEIGHT + 1}rem ${PAGE_PADDING_WIDTH}rem` } },
    [
      div(['Data Browser / ', name]),
      h1([name, ' Dataset Builder']),
      div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
        'Create groups of participants based on a specific criteria. You can also save any criteria grouping as a concept set using the menu icon next to the Participant Group title.',
        div({ style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '20rem' } }, [
          div({ style: { fontWeight: 600 } }, ['Have questions']),
          // TODO: Link to proper place
          h(Link, { href: Nav.getLink('root') }, ['See supporting documentation']),
        ]),
      ]),
    ]
  );
};

const DatasetBuilderContents = () => {
  const [selectedCohorts, setSelectedCohorts] = useState([] as ValuesSet<Cohort>[]);
  const [selectedConceptSets, setSelectedConceptSets] = useState([] as ValuesSet<ConceptSet>[]);
  const [selectedValues, setSelectedValues] = useState([] as ValuesSet<Value>[]);

  return div({ style: { padding: `${PAGE_PADDING_HEIGHT}rem ${PAGE_PADDING_WIDTH}rem` } }, [
    h2(['Datasets']),
    div([
      'Build a dataset by selecting the concept sets and values for one or more of your cohorts. Then export the completed dataset to Notebooks where you can perform your analysis',
    ]),
    div({ style: { display: 'flex', width: '100%', marginTop: '1rem' } }, [
      h(CohortSelector, {
        selectedCohorts,
        onChange: (cohorts) => {
          setSelectedCohorts(cohorts);
        },
      }),
      div({ style: { marginLeft: '1rem' } }),
      h(ConceptSetSelector, {
        selectedConceptSets,
        onChange: (conceptSets) => setSelectedConceptSets(conceptSets),
      }),
      div({ style: { marginLeft: '1rem' } }),
      h(ValuesSelector, { selectedValues, onChange: (values) => setSelectedValues(values) }),
    ]),
  ]);
};

interface DatasetBuilderProps {
  datasetId: string;
}

export const DatasetBuilderView = ({ datasetId }: DatasetBuilderProps) => {
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
        h(DatasetBuilderContents),
      ])
    : spinnerOverlay;
};

export const navPaths = [
  {
    name: 'create-dataset',
    path: '/library/builder/:datasetId',
    component: DatasetBuilderView,
    title: 'Build Dataset',
  },
];
