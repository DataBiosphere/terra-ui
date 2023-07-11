import * as _ from 'lodash/fp';
import React, { Fragment, ReactElement, useEffect, useMemo, useState } from 'react';
import { div, h, h2, h3, label, li, ul } from 'react-hyperscript-helpers';
import { ButtonPrimary, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon, spinner } from 'src/components/icons';
import { ValidatedInput, ValidatedTextArea } from 'src/components/input';
import Modal from 'src/components/Modal';
import TopBar from 'src/components/TopBar';
import { DatasetBuilder, DatasetBuilderValue, DatasetResponse, FeatureValueGroup } from 'src/libs/ajax/DatasetBuilder';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import colors from 'src/libs/colors';
import { FormLabel } from 'src/libs/forms';
import { useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { StringInput } from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs';
import { CohortEditor } from 'src/pages/library/datasetBuilder/CohortEditor';
import { ConceptSetCreator } from 'src/pages/library/datasetBuilder/ConceptSetCreator';
import {
  PAGE_PADDING_HEIGHT,
  PAGE_PADDING_WIDTH,
  PREPACKAGED_CONCEPT_SETS,
} from 'src/pages/library/datasetBuilder/constants';
import {
  AnyDatasetBuilderState,
  Cohort,
  cohortEditorState,
  ConceptSet,
  DatasetBuilderType,
  homepageState,
  newCohort,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { DatasetBuilderHeader } from 'src/pages/library/datasetBuilder/DatasetBuilderHeader';
import { DomainCriteriaSelector } from 'src/pages/library/datasetBuilder/DomainCriteriaSelector';
import { datasetBuilderCohorts, datasetBuilderConceptSets } from 'src/pages/library/datasetBuilder/state';
import { validate } from 'validate.js';

const SelectorSubHeader = ({ children }) => div({ style: { fontSize: 12, fontWeight: 600 } }, children);

interface ObjectSetListItemProps<T extends DatasetBuilderType> {
  value: T;
  checked: boolean;
  onChange: (value: T) => void;
}

const ObjectSetListItem = <T extends DatasetBuilderType>({ value, checked, onChange }: ObjectSetListItemProps<T>) => {
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
    },
    [
      h(
        LabeledCheckbox,
        {
          checked,
          onChange: () => onChange(value),
        },
        [label({ style: { paddingLeft: '0.5rem' } }, [value.name])]
      ),
    ]
  );
};

interface ObjectSetListSectionProps<T extends DatasetBuilderType> {
  objectSet: HeaderAndValues<T>;
  selectedValues: { header: string; value: T }[];
  onChange: (value, header) => void;
}

const ObjectSetListSection = <T extends DatasetBuilderType>({
  objectSet,
  selectedValues,
  onChange,
}: ObjectSetListSectionProps<T>) => {
  const isChecked = (datasetBuilderObjectSet, value) =>
    _.intersectionWith(_.isEqual, [{ header: datasetBuilderObjectSet.header, value }], selectedValues).length > 0;

  return h(Fragment, [
    h(SelectorSubHeader, [objectSet.header]),
    _.map(
      (value) =>
        h(ObjectSetListItem, {
          key: _.uniqueId(''),
          value,
          checked: isChecked(objectSet, value),
          onChange: (value) => onChange(value, objectSet.header),
        }),
      objectSet.values
    ),
  ]);
};

interface HeaderAndValues<T extends DatasetBuilderType> {
  header: string;
  values: T[];
}

interface SelectorProps<T extends DatasetBuilderType> {
  number: number;
  header: string;
  subheader?: string;
  objectSets: HeaderAndValues<T>[];
  selectedObjectSets: HeaderAndValues<T>[];
  onChange: (newDatasetBuilderObjectSets: HeaderAndValues<T>[]) => void;
  headerAction: any;
  placeholder?: any;
  style?: React.CSSProperties;
}

type SelectorComponent = <T extends DatasetBuilderType>(props: SelectorProps<T>) => ReactElement;
const Selector: SelectorComponent = <T extends DatasetBuilderType>(props) => {
  const { number, header, subheader, headerAction, placeholder, objectSets, onChange, selectedObjectSets, style } =
    props;
  const selectedValues = _.flatMap(
    (selectedDatasetBuilderObjectSet) =>
      _.map(
        (value) => ({ header: selectedDatasetBuilderObjectSet.header, value }),
        selectedDatasetBuilderObjectSet.values
      ),
    selectedObjectSets
  );

  const datasetBuilderSectionHasListItems = (datasetBuilderObjectSets) =>
    datasetBuilderObjectSets &&
    _.flatMap((datasetBuilderObjectSet) => datasetBuilderObjectSet.values, datasetBuilderObjectSets).length > 0;

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
        datasetBuilderSectionHasListItems(objectSets)
          ? div(
              { style: { display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' } },
              _.map(
                (objectSet: HeaderAndValues<T>) =>
                  h(ObjectSetListSection, {
                    key: _.uniqueId(''),
                    objectSet,
                    selectedValues,
                    onChange: (value, header) => {
                      const index = _.findIndex(
                        (selectedObjectSet: HeaderAndValues<T>) => selectedObjectSet.header === header,
                        selectedObjectSets
                      );

                      onChange(
                        index === -1
                          ? selectedObjectSets.concat({
                              header,
                              values: [value],
                            })
                          : _.set(
                              `[${index}].values`,
                              _.xorWith(_.isEqual, selectedObjectSets[index].values, [value]),
                              selectedObjectSets
                            )
                      );
                    },
                  }),
                _.filter((objectSet) => objectSet.values?.length > 0, objectSets)
              )
            )
          : div([placeholder]),
      ]
    ),
  ]);
};

export type OnStateChangeHandler = (state: AnyDatasetBuilderState) => void;
export const CreateCohortModal = ({
  onDismiss,
  onStateChange,
}: {
  onDismiss: () => void;
  onStateChange: OnStateChangeHandler;
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
    onStateChange(cohortEditorState.new(newCohort(cohortName)));
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
  selectedCohorts: HeaderAndValues<Cohort>[];
  onChange: (cohorts: HeaderAndValues<Cohort>[]) => void;
  onStateChange: OnStateChangeHandler;
}) => {
  const [creatingCohort, setCreatingCohort] = useState(false);

  return h(Fragment, [
    h(Selector<Cohort>, {
      headerAction: h(
        Link,
        {
          onClick: () => setCreatingCohort(true),
          'aria-label': 'Create new cohort',
          'aria-haspopup': 'dialog',
        },
        [icon('plus-circle-filled', { size: 24 })]
      ),
      number: 1,
      onChange,
      objectSets: [
        {
          values: datasetBuilderCohorts.get(),
          header: 'Saved cohorts',
        },
      ],
      selectedObjectSets: selectedCohorts,
      header: 'Select cohorts',
      subheader: 'Which participants to include',
      placeholder: div([
        h(SelectorSubHeader, ['No cohorts yet']),
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
  selectedConceptSets: HeaderAndValues<ConceptSet>[];
  onChange: (conceptSets: HeaderAndValues<ConceptSet>[]) => void;
  onStateChange: OnStateChangeHandler;
}) => {
  return h(Selector<ConceptSet>, {
    headerAction: h(
      Link,
      {
        onClick: () => onStateChange({ mode: 'concept-set-creator' }),
        'aria-label': 'Create new concept set',
      },
      [icon('plus-circle-filled', { size: 24 })]
    ),
    number: 2,
    onChange,
    objectSets: [
      {
        header: 'Concept sets',
        values: datasetBuilderConceptSets.get(),
      },
      {
        header: 'Prepackaged concept sets',
        values: PREPACKAGED_CONCEPT_SETS,
      },
    ],
    selectedObjectSets: selectedConceptSets,
    header: 'Select concept sets',
    subheader: 'Which information to include about participants',
    style: { marginLeft: '1rem' },
  });
};

export const ValuesSelector = ({
  selectedValues,
  values,
  onChange,
}: {
  selectedValues: HeaderAndValues<DatasetBuilderValue>[];
  values: HeaderAndValues<DatasetBuilderValue>[];
  onChange: (values: HeaderAndValues<DatasetBuilderValue>[]) => void;
}) => {
  return h(Selector, {
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
    objectSets: values,
    selectedObjectSets: selectedValues,
    header: 'Select values (columns)',
    placeholder: div([
      div(['No inputs selected']),
      div(['You can view the available values by selecting at least one cohort and concept set']),
    ]),
    style: { width: '40%', marginLeft: '1rem' },
  });
};

interface RequestAccessModalProps {
  cohorts: Cohort[];
  conceptSets: ConceptSet[];
  valuesSets: HeaderAndValues<DatasetBuilderValue>[];
  onDismiss: () => void;
}

const RequestAccessModal = (props: RequestAccessModalProps) => {
  const { onDismiss, cohorts, conceptSets, valuesSets } = props;
  const [name, setName] = useState('');
  const [researchPurposeStatement, setResearchPurposeStatement] = useState('');

  const required = { presence: { allowEmpty: false } };
  const errors = validate({ name, researchPurposeStatement }, { name: required, researchPurposeStatement: required });

  const nameId = _.uniqueId('');
  const researchPurposeId = _.uniqueId('');

  return h(
    Modal,
    {
      title: 'Requesting access',
      showX: false,
      onDismiss,
      okButton: h(
        ButtonPrimary,
        {
          disabled: errors,
          tooltip: errors && Utils.summarizeErrors(errors),
          onClick: async () => {
            await DatasetBuilder().requestAccess({
              name,
              researchPurposeStatement,
              datasetRequest: {
                cohorts,
                conceptSets,
                valuesSets: _.map((valuesSet) => ({ domain: valuesSet.header, values: valuesSet.values }), valuesSets),
              },
            });
            onDismiss();
          },
        },
        ['Request access']
      ),
    },
    [
      div([
        div([
          "A request of the dataset created will be generated and may take up to 72 hours for approval. Once approved you'll be notified by email. We'll send you a copy of this request",
        ]),
        h(FormLabel, { htmlFor: nameId, required }, ['Dataset name']),
        h(ValidatedInput, {
          inputProps: {
            id: nameId,
            'aria-label': 'Dataset name',
            autoFocus: true,
            placeholder: 'Enter a name',
            value: name,
            onChange: setName,
          },
        }),
        h(FormLabel, { htmlFor: researchPurposeId, required }, ['Research purpose statement']),
        h(ValidatedTextArea, {
          inputProps: {
            id: researchPurposeId,
            'aria-label': 'Research purpose statement',
            placeholder: 'Enter a research purpose statement',
            style: {
              marginTop: '1rem',
              height: 200,
            },
            value: researchPurposeStatement,
            onChange: setResearchPurposeStatement,
          },
        }),
      ]),
    ]
  );
};

export const DatasetBuilderContents = ({
  onStateChange,
  dataset,
}: {
  onStateChange: OnStateChangeHandler;
  dataset: DatasetResponse;
}) => {
  const [selectedCohorts, setSelectedCohorts] = useState([] as HeaderAndValues<Cohort>[]);
  const [selectedConceptSets, setSelectedConceptSets] = useState([] as HeaderAndValues<ConceptSet>[]);
  const [selectedValues, setSelectedValues] = useState([] as HeaderAndValues<DatasetBuilderValue>[]);
  const [values, setValues] = useState([] as HeaderAndValues<DatasetBuilderValue>[]);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [datasetRequestParticipantCount, setDatasetRequestParticipantCount] = useLoadedData<number>();

  const allCohorts: Cohort[] = useMemo(() => _.flatMap('values', selectedCohorts), [selectedCohorts]);
  const allConceptSets: ConceptSet[] = useMemo(() => _.flatMap('values', selectedConceptSets), [selectedConceptSets]);

  const requestValid =
    allCohorts.length > 0 && allConceptSets.length > 0 && _.flatMap('values', selectedValues).length > 0;

  useEffect(() => {
    requestValid &&
      setDatasetRequestParticipantCount(async () =>
        DatasetBuilder().getParticipantCount({
          cohorts: allCohorts,
        })
      );
  }, [selectedValues, setDatasetRequestParticipantCount, allCohorts, allConceptSets, requestValid]);

  const getNewFeatureValueGroups = (includedFeatureValueGroups: string[]): string[] =>
    _.without(
      [
        ..._.flatMap(
          (selectedValueGroups: HeaderAndValues<DatasetBuilderValue>) => selectedValueGroups.header,
          selectedValues
        ),
        ..._.flow(
          _.flatMap((selectedConceptSetGroup: HeaderAndValues<ConceptSet>) => selectedConceptSetGroup.values),
          _.map((selectedConceptSet) => selectedConceptSet.featureValueGroupName)
        )(selectedConceptSets),
      ],
      includedFeatureValueGroups
    );

  const getAvailableValuesFromFeatureGroups = (featureValueGroups: string[]): HeaderAndValues<DatasetBuilderValue>[] =>
    _.flow(
      _.filter((featureValueGroup: FeatureValueGroup) => _.includes(featureValueGroup.name, featureValueGroups)),
      _.sortBy('name'),
      _.map((featureValueGroup: FeatureValueGroup) => ({
        header: featureValueGroup.name,
        values: featureValueGroup.values,
      }))
    )(dataset.featureValueGroups);

  const createHeaderAndValuesFromFeatureValueGroups = (
    featureValueGroups: string[]
  ): HeaderAndValues<DatasetBuilderValue>[] =>
    _.flow(
      _.filter((featureValueGroup: FeatureValueGroup) => _.includes(featureValueGroup.name, featureValueGroups)),
      _.map((featureValueGroup: FeatureValueGroup) => ({
        header: featureValueGroup.name,
        values: featureValueGroup.values,
      }))
    )(dataset.featureValueGroups);

  return h(Fragment, [
    div({ style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }, [
      div({ style: { padding: `${PAGE_PADDING_HEIGHT}rem ${PAGE_PADDING_WIDTH}rem` } }, [
        h2(['Datasets']),
        div([
          'Build a dataset by selecting the concept sets and values for one or more of your cohorts. Then export the completed dataset to Notebooks where you can perform your analysis',
        ]),
        ul({ style: { display: 'flex', width: '100%', marginTop: '2rem', listStyleType: 'none', padding: 0 } }, [
          h(CohortSelector, {
            selectedCohorts,
            onChange: setSelectedCohorts,
            onStateChange,
          }),
          h(ConceptSetSelector, {
            selectedConceptSets,
            onChange: async (conceptSets) => {
              const includedFeatureValueGroups = _.flow(
                _.flatMap((headerAndValues: HeaderAndValues<ConceptSet>) => headerAndValues.values),
                _.map((conceptSet: ConceptSet) => conceptSet.featureValueGroupName)
              )(conceptSets);
              const newFeatureValueGroups = getNewFeatureValueGroups(includedFeatureValueGroups);
              setSelectedValues([
                ...selectedValues,
                ...createHeaderAndValuesFromFeatureValueGroups(newFeatureValueGroups),
              ]);
              setSelectedConceptSets(conceptSets);
              setValues(getAvailableValuesFromFeatureGroups(includedFeatureValueGroups));
            },
            onStateChange,
          }),
          h(ValuesSelector, {
            selectedValues,
            values,
            onChange: setSelectedValues,
          }),
        ]),
      ]),
      requestValid &&
        div(
          {
            style: {
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              height: '5rem',
              position: 'absolute',
              bottom: 0,
              backgroundColor: 'white',
              boxShadow: '0 0 4px 0 rgba(0,0,0,0.5)',
              alignItems: 'center',
              padding: '1rem 2rem',
            },
          },
          [
            div({ style: { display: 'flex', alignItems: 'center' } }, [
              datasetRequestParticipantCount.status === 'Ready' ? datasetRequestParticipantCount.state : spinner(),
              ' Participants in this dataset',
            ]),
            h(
              ButtonPrimary,
              { style: { marginLeft: '2rem', borderRadius: 0 }, onClick: () => setRequestingAccess(true) },
              ['Request access to this dataset']
            ),
          ]
        ),
    ]),
    requestingAccess &&
      h(RequestAccessModal, {
        cohorts: allCohorts,
        conceptSets: allConceptSets,
        valuesSets: selectedValues,
        onDismiss: () => setRequestingAccess(false),
      }),
  ]);
};

interface DatasetBuilderProps {
  datasetId: string;
  initialState?: AnyDatasetBuilderState;
}

const editorBackgroundColor = colors.light(0.7);

export const DatasetBuilderView: React.FC<DatasetBuilderProps> = (props) => {
  const { datasetId, initialState } = props;
  const [datasetDetails, loadDatasetDetails] = useLoadedData<DatasetResponse>();
  const [datasetBuilderState, setDatasetBuilderState] = useState<AnyDatasetBuilderState>(
    initialState || homepageState.new()
  );
  const onStateChange = setDatasetBuilderState;

  useOnMount(() => {
    void loadDatasetDetails(() => DatasetBuilder().retrieveDataset(datasetId));
  });
  return datasetDetails.status === 'Ready'
    ? h(FooterWrapper, [
        h(TopBar, { title: 'Preview', href: '' }, []),
        h(DatasetBuilderHeader, { datasetDetails: datasetDetails.state }),
        div({ style: { backgroundColor: editorBackgroundColor } }, [
          (() => {
            switch (datasetBuilderState.mode) {
              case 'homepage':
                return h(DatasetBuilderContents, {
                  onStateChange,
                  dataset: datasetDetails.state,
                });
              case 'cohort-editor':
                return h(CohortEditor, {
                  onStateChange,
                  originalCohort: datasetBuilderState.cohort,
                  datasetDetails: datasetDetails.state,
                });
              case 'domain-criteria-selector':
                return h(DomainCriteriaSelector, { state: datasetBuilderState, onStateChange });
              case 'concept-set-creator':
                return h(ConceptSetCreator, { onStateChange, datasetDetails: datasetDetails.state });
              default:
                return div([datasetBuilderState.mode]);
            }
          })(),
        ]),
        div({ style: { backgroundColor: editorBackgroundColor, height: '100%' } }, []),
      ])
    : spinnerOverlay;
};

export const navPaths = [
  {
    name: 'create-dataset',
    path: '/library/builder/:datasetId/build',
    component: DatasetBuilderView,
    title: 'Build Dataset',
  },
];
