import { Clickable, Modal, Spinner } from '@terra-ui-packages/components';
import * as _ from 'lodash/fp';
import React, { Fragment, ReactElement, useEffect, useMemo, useState } from 'react';
import { div, h, h2, h3, label, li, ul } from 'react-hyperscript-helpers';
import { ActionBar } from 'src/components/ActionBar';
import { ButtonPrimary, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon } from 'src/components/icons';
import { ValidatedInput, ValidatedTextArea } from 'src/components/input';
import { MenuButton } from 'src/components/MenuButton';
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger';
import TopBar from 'src/components/TopBar';
import { StringInput } from 'src/data-catalog/create-dataset/CreateDatasetInputs';
import {
  Cohort,
  ConceptSet,
  DatasetBuilderType,
  DatasetBuilderValue,
  DatasetParticipantCountResponse,
  displayParticipantCount,
} from 'src/dataset-builder/DatasetBuilderUtils';
import { DomainCriteriaSearch } from 'src/dataset-builder/DomainCriteriaSearch';
import {
  DataRepo,
  datasetIncludeTypes,
  DatasetModel,
  SnapshotBuilderDatasetConceptSets as DatasetConceptSets,
  SnapshotBuilderFeatureValueGroup as FeatureValueGroup,
} from 'src/libs/ajax/DataRepo';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import colors from 'src/libs/colors';
import { FormLabel } from 'src/libs/forms';
import { useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { validate } from 'validate.js';

import { CohortEditor } from './CohortEditor';
import { ConceptSetCreator } from './ConceptSetCreator';
import { AnyDatasetBuilderState, cohortEditorState, homepageState, newCohort, Updater } from './dataset-builder-types';
import { BuilderPageHeader, DatasetBuilderHeader } from './DatasetBuilderHeader';
import { DomainCriteriaSelector } from './DomainCriteriaSelector';

const SelectorSubHeader = ({ children }) => div({ style: { fontSize: 12, fontWeight: 600 } }, children);

interface ObjectSetListItemProps<T extends DatasetBuilderType> {
  value: T;
  checked: boolean;
  onChange: (value: T) => void;
  icon?: ReactElement;
}

const ObjectSetListItem = <T extends DatasetBuilderType>(props: ObjectSetListItemProps<T>) => {
  const { value, checked, onChange } = props;
  return div(
    {
      style: {
        display: 'flex',
        padding: '0.5rem',
        border: `1px solid ${colors.light()}`,
        width: '100%',
        marginTop: '0.3rem',
        fontSize: 13,
        alignItems: 'center',
        justifyContent: 'space-between',
      },
    },
    [
      div([
        h(
          LabeledCheckbox,
          {
            checked,
            onChange: () => onChange(value),
          },
          [label({ style: { paddingLeft: '0.5rem' } }, [value.name])]
        ),
      ]),
      props.icon,
    ]
  );
};

interface ObjectSetListSectionProps<T extends DatasetBuilderType> {
  objectSet: HeaderAndValues<T>;
  selectedValues: { header: string; value: T }[];
  onChange: (value, header) => void;
}

const ObjectSetListSection = <T extends DatasetBuilderType>(props: ObjectSetListSectionProps<T>) => {
  const { objectSet, selectedValues, onChange } = props;
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
          icon: objectSet.makeIcon?.(value, objectSet.header),
        }),
      objectSet.values
    ),
  ]);
};

interface HeaderAndValues<T extends DatasetBuilderType> {
  header: string;
  values: T[];
  makeIcon?: (value, header) => ReactElement;
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
  cohorts,
}: {
  onDismiss: () => void;
  onStateChange: OnStateChangeHandler;
  cohorts: Cohort[];
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
            within: _.map((cohort: Cohort) => cohort.name, cohorts),
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
  cohorts,
  selectedCohorts,
  updateCohorts,
  onChange,
  onStateChange,
}: {
  cohorts: Cohort[];
  selectedCohorts: HeaderAndValues<Cohort>[];
  updateCohorts: Updater<Cohort[]>;
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
          values: cohorts,
          header: 'Saved cohorts',
          makeIcon: (value, header) =>
            h(
              MenuTrigger,
              {
                closeOnClick: true,
                style: { marginLeft: '1rem' },
                content: h(Fragment, [
                  h(
                    MenuButton,
                    { 'aria-label': 'Edit cohort', onClick: () => onStateChange(cohortEditorState.new(value)) },
                    ['Edit']
                  ),
                  h(
                    MenuButton,
                    {
                      'aria-label': 'Delete cohort',
                      onClick: () => updateCohorts(_.without([value])),
                    },
                    ['Delete']
                  ),
                ]),
              },
              [makeMenuIcon('menu-icon-filled', { size: 20, 'aria-label': `${header}/${value.name} menu` })]
            ),
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
    creatingCohort && h(CreateCohortModal, { onDismiss: () => setCreatingCohort(false), onStateChange, cohorts }),
  ]);
};

export const ConceptSetSelector = ({
  conceptSets,
  prepackagedConceptSets,
  selectedConceptSets,
  updateConceptSets,
  onChange,
  onStateChange,
}: {
  conceptSets: DatasetConceptSets[];
  prepackagedConceptSets?: DatasetConceptSets[];
  selectedConceptSets: HeaderAndValues<ConceptSet>[];
  updateConceptSets: Updater<ConceptSet[]>;
  onChange: (conceptSets: HeaderAndValues<ConceptSet>[]) => void;
  onStateChange: OnStateChangeHandler;
}) => {
  return h(Selector<DatasetConceptSets>, {
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
        values: conceptSets,
        makeIcon: (value, header) =>
          h(
            Clickable,
            {
              'aria-label': `Delete ${header}/${value.name}`,
              onClick: () => updateConceptSets(_.without([value])),
            },
            [icon('trash-circle-filled', { size: 20 })]
          ),
      },
      { header: 'Prepackaged concept sets', values: prepackagedConceptSets ?? [] },
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
  datasetId: string;
}

const RequestAccessModal = (props: RequestAccessModalProps) => {
  const { onDismiss, cohorts, conceptSets, valuesSets, datasetId } = props;
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
            await DataRepo()
              .dataset(datasetId)
              .createSnapshotRequest({
                name,
                researchPurposeStatement,
                datasetRequest: {
                  cohorts,
                  conceptSets,
                  valueSets: _.map((valuesSet) => ({ domain: valuesSet.header, values: valuesSet.values }), valuesSets),
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

export type DatasetBuilderContentsProps = {
  onStateChange: OnStateChangeHandler;
  updateCohorts: Updater<Cohort[]>;
  updateConceptSets: Updater<DatasetConceptSets[]>;
  dataset: DatasetModel;
  cohorts: Cohort[];
  conceptSets: ConceptSet[];
};

export const DatasetBuilderContents = ({
  onStateChange,
  updateCohorts,
  updateConceptSets,
  dataset,
  cohorts,
  conceptSets,
}: DatasetBuilderContentsProps) => {
  const [selectedCohorts, setSelectedCohorts] = useState([] as HeaderAndValues<Cohort>[]);
  const [selectedConceptSets, setSelectedConceptSets] = useState([] as HeaderAndValues<ConceptSet>[]);
  const [selectedValues, setSelectedValues] = useState([] as HeaderAndValues<DatasetBuilderValue>[]);
  const [values, setValues] = useState([] as HeaderAndValues<DatasetBuilderValue>[]);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [datasetRequestParticipantCount, setDatasetRequestParticipantCount] =
    useLoadedData<DatasetParticipantCountResponse>();

  const allCohorts: Cohort[] = useMemo(() => _.flatMap('values', selectedCohorts), [selectedCohorts]);
  const allConceptSets: ConceptSet[] = useMemo(() => _.flatMap('values', selectedConceptSets), [selectedConceptSets]);

  const requestValid =
    allCohorts.length > 0 && allConceptSets.length > 0 && _.flatMap('values', selectedValues).length > 0;

  useEffect(() => {
    requestValid &&
      setDatasetRequestParticipantCount(async () =>
        DataRepo().dataset(dataset.id).getCounts({
          cohorts: allCohorts,
        })
      );
  }, [dataset, selectedValues, setDatasetRequestParticipantCount, allCohorts, allConceptSets, requestValid]);

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
        values: _.map((value) => ({ name: value }), featureValueGroup.values),
      }))
    )(dataset.snapshotBuilderSettings?.featureValueGroups);

  const createHeaderAndValuesFromFeatureValueGroups = (
    featureValueGroups: string[]
  ): HeaderAndValues<DatasetBuilderValue>[] =>
    _.flow(
      _.filter((featureValueGroup: FeatureValueGroup) => _.includes(featureValueGroup.name, featureValueGroups)),
      _.map((featureValueGroup: FeatureValueGroup) => ({
        header: featureValueGroup.name,
        values: _.map((value) => ({ name: value }), featureValueGroup.values),
      }))
    )(dataset.snapshotBuilderSettings?.featureValueGroups);

  return h(Fragment, [
    div({ style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }, [
      h(BuilderPageHeader, [
        h2(['Datasets']),
        div([
          'Build a dataset by selecting the concept sets and values for one or more of your cohorts. Then export the completed dataset to Notebooks where you can perform your analysis',
        ]),
        ul({ style: { display: 'flex', width: '100%', marginTop: '2rem', listStyleType: 'none', padding: 0 } }, [
          h(CohortSelector, {
            cohorts,
            selectedCohorts,
            onChange: setSelectedCohorts,
            updateCohorts,
            onStateChange,
          }),
          h(ConceptSetSelector, {
            conceptSets,
            prepackagedConceptSets: dataset.snapshotBuilderSettings?.datasetConceptSets,
            selectedConceptSets,
            updateConceptSets,
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
        h(ActionBar, {
          prompt: h(Fragment, [
            datasetRequestParticipantCount.status === 'Ready'
              ? displayParticipantCount(datasetRequestParticipantCount.state.result.total)
              : h(Spinner),
            ' participants in this dataset',
          ]),
          actionText: 'Request access to this dataset',
          onClick: () => setRequestingAccess(true),
        }),
    ]),
    requestingAccess &&
      h(RequestAccessModal, {
        cohorts: allCohorts,
        conceptSets: allConceptSets,
        valuesSets: selectedValues,
        onDismiss: () => setRequestingAccess(false),
        datasetId: dataset.id,
      }),
  ]);
};

interface DatasetBuilderProps {
  datasetId: string;
  initialState?: AnyDatasetBuilderState;
}

const editorBackgroundColor = colors.light(0.7);

let criteriaCount = 1;

export const DatasetBuilderView: React.FC<DatasetBuilderProps> = (props) => {
  const { datasetId, initialState } = props;
  const [datasetModel, loadDatasetModel] = useLoadedData<DatasetModel>();
  const [datasetBuilderState, setDatasetBuilderState] = useState<AnyDatasetBuilderState>(
    initialState || homepageState.new()
  );
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [conceptSets, setConceptSets] = useState<DatasetConceptSets[]>([]);
  const onStateChange = setDatasetBuilderState;

  const getNextCriteriaIndex = () => {
    criteriaCount++;
    return criteriaCount;
  };

  useOnMount(() => {
    void loadDatasetModel(async () =>
      DataRepo()
        .dataset(datasetId)
        .details([datasetIncludeTypes.SNAPSHOT_BUILDER_SETTINGS, datasetIncludeTypes.PROPERTIES])
    );
  });
  return datasetModel.status === 'Ready'
    ? h(FooterWrapper, [
        h(TopBar, { title: 'Preview', href: '' }, []),
        h(DatasetBuilderHeader, { datasetDetails: datasetModel.state }),
        div({ style: { backgroundColor: editorBackgroundColor } }, [
          (() => {
            switch (datasetBuilderState.mode) {
              case 'homepage':
                return h(DatasetBuilderContents, {
                  onStateChange,
                  updateCohorts: setCohorts,
                  updateConceptSets: setConceptSets,
                  dataset: datasetModel.state,
                  cohorts,
                  conceptSets,
                });
              case 'cohort-editor':
                return datasetModel.state.snapshotBuilderSettings
                  ? h(CohortEditor, {
                      onStateChange,
                      originalCohort: datasetBuilderState.cohort,
                      dataset: datasetModel.state,
                      updateCohorts: setCohorts,
                      getNextCriteriaIndex,
                    })
                  : div(['No Dataset Builder Settings Found']);
              case 'domain-criteria-selector':
                return h(DomainCriteriaSelector, {
                  state: datasetBuilderState,
                  onStateChange,
                  datasetId,
                  getNextCriteriaIndex,
                });
              case 'domain-criteria-search':
                return h(DomainCriteriaSearch, {
                  state: datasetBuilderState,
                  onStateChange,
                  datasetId,
                  getNextCriteriaIndex,
                });
              case 'concept-set-creator':
                return datasetModel.state.snapshotBuilderSettings
                  ? h(ConceptSetCreator, {
                      onStateChange,
                      dataset: datasetModel.state,
                      conceptSetUpdater: setConceptSets,
                    })
                  : div(['No Dataset Builder Settings Found']);
              default:
                return datasetBuilderState;
            }
          })(),
        ]),
        div({ style: { backgroundColor: editorBackgroundColor, height: '100%' } }, []),
      ])
    : spinnerOverlay;
};
