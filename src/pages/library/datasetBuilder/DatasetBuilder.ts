import * as _ from 'lodash/fp';
import React, { Fragment, useEffect, useState } from 'react';
import { div, h, h2, h3, label } from 'react-hyperscript-helpers';
import { ButtonPrimary, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon } from 'src/components/icons';
import Modal from 'src/components/Modal';
import TopBar from 'src/components/TopBar';
import { DatasetBuilder, DatasetResponse } from 'src/libs/ajax/DatasetBuilder';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { datasetBuilderCohorts, datasetBuilderConceptSets } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { StringInput } from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs';
import {
  PAGE_PADDING_HEIGHT,
  PAGE_PADDING_WIDTH,
  PREPACKAGED_CONCEPT_SETS,
} from 'src/pages/library/datasetBuilder/constants';
import { Cohort, ConceptSet, DatasetBuilderType } from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { DatasetBuilderHeader } from 'src/pages/library/datasetBuilder/DatasetBuilderHeader';
import { validate } from 'validate.js';

const DatasetBuilderSelectorSubHeader = ({ children }) => div({ style: { fontSize: 12, fontWeight: 600 } }, children);

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
              backgroundColor: colors.accent(0.2),
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
        valuesSets && valuesSets.length > 0 && _.flatMap((valuesSet) => valuesSet.values, valuesSets).length > 0
          ? div(
              { style: { display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' } },
              _.map(
                ([i, valuesSet]) =>
                  // valuesSet.values.length > 0 &&
                  valuesSet.values &&
                  valuesSet.values.length > 0 &&
                  h(Fragment, [
                    h(DatasetBuilderSelectorSubHeader, { key: `${valuesSet.header}-${i}` }, [valuesSet.header]),
                    _.map(([j, value]) => {
                      return div(
                        {
                          style: {
                            display: 'flex',
                            padding: '0.5rem',
                            border: `1px solid ${colors.light()}`,
                            width: '100%',
                            marginTop: '0.3rem',
                            fontSize: 13,
                          },
                          key: `${valuesSet.header}-${value.name}-${j}`,
                        },
                        [
                          h(
                            LabeledCheckbox,
                            {
                              key: `${valuesSet.header}-${value.name}-${j}-checkbox`,
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
                      );
                    }, Utils.toIndexPairs(valuesSet.values)),
                  ]),
                Utils.toIndexPairs(valuesSets)
              )
            )
          : div([placeholder]),
      ]
    ),
  ]);
};

export const CreateCohortModal = ({ onDismiss }: { onDismiss: () => void }) => {
  const [cohortNameTouched, setCohortNameTouched] = useState(false);
  const [cohortName, setCohortName] = useState('');

  const errors = cohortNameTouched && validate({ cohortName }, { cohortName: { presence: { allowEmpty: false } } });

  const createCohort = (cohortName) => {
    // Once state is typed, the ts-ignore should go away
    // @ts-ignore
    datasetBuilderCohorts.set(datasetBuilderCohorts.get().concat({ name: cohortName }));
    // TODO: navigate to cohortEdit page
  };

  return h(
    Modal,
    {
      onDismiss,
      title: 'Create a new cohort',
      okButton: h(
        ButtonPrimary,
        {
          onClick: () => {
            createCohort(cohortName);
            onDismiss();
          },
          disabled: !cohortNameTouched || errors?.cohortName,
        },
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
        errors: errors?.cohortName,
        placeholder: 'Enter the cohort name',
        required: true,
      }),
    ]
  );
};

export const CohortSelector = ({
  selectedCohorts,
  onChange,
}: {
  selectedCohorts: ValuesSet<Cohort>[];
  onChange: (cohorts: ValuesSet<Cohort>[]) => void;
}) => {
  const [creatingCohort, setCreatingCohort] = useState(false);

  return h(Fragment, [
    h(DatasetBuilderSelector as React.FC<DatasetBuilderSelectorProps<Cohort>>, {
      headerAction: h(
        Link,
        {
          onClick: () => setCreatingCohort(true),
          'aria-label': 'Create new cohort',
          'aria-haspopup': 'dialog',
        },
        [icon('plus-circle', { size: 24 })]
      ),
      number: 1,
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
    creatingCohort && h(CreateCohortModal, { onDismiss: () => setCreatingCohort(false) }),
  ]);
};

export const ConceptSetSelector = ({
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
        values: PREPACKAGED_CONCEPT_SETS,
      },
    ],
    selectedValuesSets: selectedConceptSets,
    header: 'Select concept sets',
    subheader: 'Which information to include about participants',
  });
};

type Value = DatasetBuilderType;
export const ValuesSelector = ({
  selectedValues,
  values,
  onChange,
}: {
  selectedValues: ValuesSet<Value>[];
  values: ValuesSet<Value>[];
  onChange: (values: ValuesSet<Value>[]) => void;
}) => {
  return h(DatasetBuilderSelector as React.FC<DatasetBuilderSelectorProps<Value>>, {
    headerAction: div([
      h(
        LabeledCheckbox,
        {
          checked: values.length !== 0 && _.isEqual(values, selectedValues),
          onChange: (checked) => (checked ? onChange(values) : onChange([])),
          disabled: values.length === 0,
        },
        [label({ style: { paddingLeft: '0.5rem' } }, ['Select All'])]
      ),
    ]),
    number: 3,
    onChange,
    valuesSets: values,
    selectedValuesSets: selectedValues,
    header: 'Select values (columns)',
    placeholder: div([
      div(['No inputs selected']),
      div(['You can view the available values by selecting at least one cohort and concept set']),
    ]),
    width: '40%',
  });
};

export const DatasetBuilderContents = () => {
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
      h(ValuesSelector, { selectedValues, values: [], onChange: (values) => setSelectedValues(values) }),
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
      void loadDatasetDetails(() => DatasetBuilder().retrieveDataset(datasetId));
    },
    // loadDatasetDetails changes on each render, so cannot depend on it
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
