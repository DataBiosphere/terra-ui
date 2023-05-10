import * as _ from 'lodash/fp';
import React, { Fragment, useState } from 'react';
import { div, h, h2, h3, label, li, ul } from 'react-hyperscript-helpers';
import { ButtonPrimary, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon } from 'src/components/icons';
import Modal from 'src/components/Modal';
import TopBar from 'src/components/TopBar';
import { DatasetBuilder, DatasetResponse } from 'src/libs/ajax/DatasetBuilder';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import colors from 'src/libs/colors';
import { useOnMount } from 'src/libs/react-utils';
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

interface DatasetBuilderObjectSet<T extends DatasetBuilderType> {
  header: string;
  values: T[];
}

interface DatasetBuilderSelectorProps<T extends DatasetBuilderType> {
  number: number;
  header: string;
  subheader?: string;
  datasetBuilderObjectSets: DatasetBuilderObjectSet<T>[];
  selectedDatasetBuilderObjectSets: DatasetBuilderObjectSet<T>[];
  onChange: (newDatasetBuilderObjectSets: DatasetBuilderObjectSet<T>[]) => void;
  headerAction: any;
  placeholder?: any;
  style?: React.CSSProperties;
}
const DatasetBuilderSelector = <T extends DatasetBuilderType>({
  number,
  header,
  subheader,
  headerAction,
  placeholder,
  datasetBuilderObjectSets,
  onChange,
  selectedDatasetBuilderObjectSets,
  style,
}: DatasetBuilderSelectorProps<T>) => {
  const isChecked = (datasetBuilderObjectSet, value) => {
    return _.flow(
      _.filter(
        (selectedDatasetBuilderObjectSet: DatasetBuilderObjectSet<T>) =>
          selectedDatasetBuilderObjectSet.header === datasetBuilderObjectSet.header
      ),
      _.flatMap((selectedDatasetBuilderObjectSet) => selectedDatasetBuilderObjectSet.values),
      _.map((selectedValue) => selectedValue.name),
      _.includes(value.name)
    )(selectedDatasetBuilderObjectSets);
  };

  return li({ style: { width: '30%', ...style } }, [
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
        datasetBuilderObjectSets &&
        _.flatMap((datasetBuilderObjectSet) => datasetBuilderObjectSet.values, datasetBuilderObjectSets).length > 0
          ? div(
              { style: { display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' } },
              _.map(
                ([i, datasetBuilderObjectSet]) =>
                  h(Fragment, [
                    h(DatasetBuilderSelectorSubHeader, { key: `${datasetBuilderObjectSet.header}-${i}` }, [
                      datasetBuilderObjectSet.header,
                    ]),
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
                          key: `${datasetBuilderObjectSet.header}-${value.name}-${j}`,
                        },
                        [
                          h(
                            LabeledCheckbox,
                            {
                              key: `${datasetBuilderObjectSet.header}-${value.name}-${j}-checkbox`,
                              checked: isChecked(datasetBuilderObjectSet, value),
                              onChange: () => {
                                const index = _.findIndex(
                                  (selectedDatasetBuilderObjectSet) =>
                                    selectedDatasetBuilderObjectSet.header === datasetBuilderObjectSet.header,
                                  selectedDatasetBuilderObjectSets
                                );

                                onChange(
                                  index === -1
                                    ? selectedDatasetBuilderObjectSets.concat({
                                        header: datasetBuilderObjectSet.header,
                                        values: [value],
                                      })
                                    : _.set(
                                        `[${index}].values`,
                                        _.xorWith(_.isEqual, selectedDatasetBuilderObjectSets[index].values, [value]),
                                        selectedDatasetBuilderObjectSets
                                      )
                                );
                              },
                            },
                            [label({ style: { paddingLeft: '0.5rem' } }, [value.name])]
                          ),
                        ]
                      );
                    }, Utils.toIndexPairs(datasetBuilderObjectSet.values)),
                  ]),
                Utils.toIndexPairs(
                  _.filter(
                    (datasetBuilderObjectSet) => datasetBuilderObjectSet.values?.length > 0,
                    datasetBuilderObjectSets
                  )
                )
              )
            )
          : div([placeholder]),
      ]
    ),
  ]);
};

export const CreateCohortModal = ({
  onDismiss,
  onStateChange,
}: {
  onDismiss: () => void;
  onStateChange: OnStateChangeType;
}) => {
  const [cohortNameTouched, setCohortNameTouched] = useState(false);
  const [cohortName, setCohortName] = useState('');

  const errors =
    cohortNameTouched &&
    validate(
      { cohortName },
      {
        cohortName: {
          presence: {
            allowEmpty: false,
          },
          exclusion: {
            within: _.map((cohort: Cohort) => cohort.name, datasetBuilderCohorts.get()),
            message: 'already exists',
          },
        },
      }
    );

  const createCohort = (cohortName) => {
    // Once state is typed, the ts-ignore should go away
    // @ts-ignore
    datasetBuilderCohorts.set(datasetBuilderCohorts.get().concat({ name: cohortName }));
    onStateChange('cohort-editor');
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
  onStateChange,
}: {
  selectedCohorts: DatasetBuilderObjectSet<Cohort>[];
  onChange: (cohorts: DatasetBuilderObjectSet<Cohort>[]) => void;
  onStateChange: OnStateChangeType;
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
      datasetBuilderObjectSets: [
        {
          values: datasetBuilderCohorts.get(),
          header: 'Saved cohorts',
        },
      ],
      selectedDatasetBuilderObjectSets: selectedCohorts,
      header: 'Select cohorts',
      subheader: 'Which participants to include',
      placeholder: div([
        h(DatasetBuilderSelectorSubHeader, ['No cohorts yet']),
        div(["Create a cohort by clicking on the '+' icon"]),
      ]),
    }),
    creatingCohort && h(CreateCohortModal, { onDismiss: () => setCreatingCohort(false), onStateChange }),
  ]);
};

export const ConceptSetSelector = ({
  selectedConceptSets,
  onChange,
  onStateChange,
}: {
  selectedConceptSets: DatasetBuilderObjectSet<ConceptSet>[];
  onChange: (conceptSets: DatasetBuilderObjectSet<ConceptSet>[]) => void;
  onStateChange: OnStateChangeType;
}) => {
  return h(DatasetBuilderSelector as React.FC<DatasetBuilderSelectorProps<ConceptSet>>, {
    headerAction: h(
      Link,
      {
        onClick: () => onStateChange('concept-set-creator'),
        'aria-label': 'Create new concept set',
      },
      [icon('plus-circle', { size: 24 })]
    ),
    number: 2,
    onChange,
    datasetBuilderObjectSets: [
      {
        header: 'Concept sets',
        values: datasetBuilderConceptSets.get(),
      },
      {
        header: 'Prepackaged concept sets',
        values: PREPACKAGED_CONCEPT_SETS,
      },
    ],
    selectedDatasetBuilderObjectSets: selectedConceptSets,
    header: 'Select concept sets',
    subheader: 'Which information to include about participants',
    style: { marginLeft: '1rem' },
  });
};

type Value = DatasetBuilderType;
export const ValuesSelector = ({
  selectedValues,
  values,
  onChange,
}: {
  selectedValues: DatasetBuilderObjectSet<Value>[];
  values: DatasetBuilderObjectSet<Value>[];
  onChange: (values: DatasetBuilderObjectSet<Value>[]) => void;
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
    datasetBuilderObjectSets: values,
    selectedDatasetBuilderObjectSets: selectedValues,
    header: 'Select values (columns)',
    placeholder: div([
      div(['No inputs selected']),
      div(['You can view the available values by selecting at least one cohort and concept set']),
    ]),
    style: { width: '40%', marginLeft: '1rem' },
  });
};

export const DatasetBuilderContents = ({ onStateChange }: { onStateChange: OnStateChangeType }) => {
  const [selectedCohorts, setSelectedCohorts] = useState([] as DatasetBuilderObjectSet<Cohort>[]);
  const [selectedConceptSets, setSelectedConceptSets] = useState([] as DatasetBuilderObjectSet<ConceptSet>[]);
  const [selectedValues, setSelectedValues] = useState([] as DatasetBuilderObjectSet<Value>[]);

  return div({ style: { padding: `${PAGE_PADDING_HEIGHT}rem ${PAGE_PADDING_WIDTH}rem` } }, [
    h2(['Datasets']),
    div([
      'Build a dataset by selecting the concept sets and values for one or more of your cohorts. Then export the completed dataset to Notebooks where you can perform your analysis',
    ]),
    ul({ style: { display: 'flex', width: '100%', marginTop: '2rem', listStyleType: 'none', padding: 0 } }, [
      h(CohortSelector, {
        selectedCohorts,
        onChange: (cohorts) => {
          setSelectedCohorts(cohorts);
        },
        onStateChange,
      }),
      h(ConceptSetSelector, {
        selectedConceptSets,
        onChange: (conceptSets) => setSelectedConceptSets(conceptSets),
        onStateChange,
      }),
      h(ValuesSelector, { selectedValues, values: [], onChange: (values) => setSelectedValues(values) }),
    ]),
  ]);
};

type DatasetBuilderState = 'homepage' | 'cohort-editor' | 'concept-selector' | 'concept-set-creator';
type OnStateChangeType = (state: DatasetBuilderState) => void;

interface DatasetBuilderProps {
  datasetId: string;
}

export const DatasetBuilderView = ({ datasetId }: DatasetBuilderProps) => {
  const [datasetDetails, loadDatasetDetails] = useLoadedData<DatasetResponse>();
  const [datasetBuilderState, setDatasetBuilderState] = useState<DatasetBuilderState>('homepage');

  useOnMount(() => {
    void loadDatasetDetails(() => DatasetBuilder().retrieveDataset(datasetId));
  });
  return datasetDetails.status === 'Ready'
    ? h(FooterWrapper, {}, [
        h(TopBar, { title: 'Preview', href: '' }, []),
        h(DatasetBuilderHeader, { name: datasetDetails.state.name }),
        Utils.switchCase(
          datasetBuilderState,
          ['homepage', () => h(DatasetBuilderContents, { onStateChange: (state) => setDatasetBuilderState(state) })],
          [Utils.DEFAULT, () => div([datasetBuilderState])]
        ),
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
