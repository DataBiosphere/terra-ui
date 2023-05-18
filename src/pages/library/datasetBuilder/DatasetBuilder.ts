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
import { StringInput } from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs';
import { Cohort, ConceptSet, DatasetBuilderType } from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { datasetBuilderCohorts, datasetBuilderConceptSets } from 'src/pages/library/datasetBuilder/state';
import { validate } from 'validate.js';

const PAGE_PADDING_HEIGHT = 0;
const PAGE_PADDING_WIDTH = 3;

interface DatasetBuilderSelectorProps<T extends DatasetBuilderType> {
  number: number;
  header: string;
  subheader?: string;
  values: T[];
  selectedValues: T[];
  onChange: (values: T[]) => void;
  headerAction: any;
  placeholder?: any;
  prepackagedValues?: T[];
  width?: string | number;
  maxWidth?: number;
}
const DatasetBuilderSelector = <T extends DatasetBuilderType>({
  number,
  header,
  subheader,
  headerAction,
  placeholder,
  values,
  onChange,
  selectedValues,
  prepackagedValues,
  width = '30%',
  maxWidth = 450,
}: DatasetBuilderSelectorProps<T>) => {
  return div({ style: { width, marginTop: '1rem', maxWidth } }, [
    div({ style: { display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' } }, [
      div({ style: { display: 'flex' } }, [
        div(
          {
            style: {
              backgroundColor: colors.dark(0.2),
              padding: '0.5rem',
              borderRadius: '2rem',
              fontSize: 20,
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
        (values && values.length > 0) || (prepackagedValues && prepackagedValues.length > 0)
          ? div({ style: { display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' } }, [
              _.map(
                (value, i) =>
                  div({ style: { display: 'flex' } }, [
                    h(
                      LabeledCheckbox,
                      {
                        checked: _.includes(value, selectedValues),
                        onChange: () => onChange([value]),
                        key: i,
                      },
                      [label([value.name])]
                    ),
                  ]),
                values
              ),
            ])
          : div([placeholder]),
      ]
    ),
  ]);
};

const CohortSelector = ({
  selectedCohorts,
  onChange,
}: {
  selectedCohorts: Cohort[];
  onChange: (cohorts: Cohort[]) => void;
}) => {
  const [creatingCohort, setCreatingCohort] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [cohortNameTouched, setCohortNameTouched] = useState(false);

  const errors = cohortNameTouched && validate({ cohortName }, { cohortName: { presence: { allowEmpty: false } } });

  const createCohort = (_cohortName) => {
    // TODO: implement create cohort (push to global state and navigate to cohort edit page)
    // console.log(cohortName);
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
      values: datasetBuilderCohorts.get(),
      selectedValues: selectedCohorts,
      header: 'Select cohorts',
      subheader: 'Which participants to include',
      placeholder: div([div(['No cohorts yet']), div(["Create a cohort by clicking on the '+' icon"])]),
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
  selectedConceptSets: ConceptSet[];
  onChange: (conceptSets: ConceptSet[]) => void;
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
    values: datasetBuilderConceptSets.get(),
    selectedValues: selectedConceptSets,
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
  selectedValues: Value[];
  onChange: (values: Value[]) => void;
}) => {
  return h(DatasetBuilderSelector as React.FC<DatasetBuilderSelectorProps<Value>>, {
    // TODO: Implement select all logic
    headerAction: div(['Select All']),
    number: 3,
    onChange,
    values: [],
    selectedValues,
    header: 'Select values (columns)',
    placeholder: div([
      div(['No inputs selected']),
      div(['You can view the available values by selecting at least one cohort and concept set']),
    ]),
    width: '40%',
    maxWidth: 600,
  });
};

export const DatasetBuilderHeader = ({ name }: { name: string }) => {
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
  const [selectedCohorts, setSelectedCohorts] = useState([] as Cohort[]);
  const [selectedConceptSets, setSelectedConceptSets] = useState([] as ConceptSet[]);
  const [selectedValues, setSelectedValues] = useState([] as Value[]);

  return div({ style: { padding: `${PAGE_PADDING_HEIGHT}rem ${PAGE_PADDING_WIDTH}rem` } }, [
    h2(['Datasets']),
    div([
      'Build a dataset by selecting the concept sets and values for one or more of your cohorts. Then export the completed dataset to Notebooks where you can perform your analysis',
    ]),
    div({ style: { display: 'flex', width: '100%', marginTop: '1rem' } }, [
      h(CohortSelector, {
        selectedCohorts,
        onChange: (cohorts) => {
          // console.log(cohorts);
          // console.log(selectedCohorts);
          setSelectedCohorts(_.xor(selectedCohorts, cohorts));
        },
      }),
      div({ style: { marginLeft: '1rem' } }),
      h(ConceptSetSelector, {
        selectedConceptSets,
        onChange: (conceptSets) => setSelectedConceptSets(_.xor(selectedConceptSets, conceptSets)),
      }),
      div({ style: { marginLeft: '1rem' } }),
      h(ValuesSelector, { selectedValues, onChange: (values) => setSelectedValues(_.xor(selectedValues, values)) }),
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
