import { Modal, Spinner, useLoadedData } from '@terra-ui-packages/components';
import * as _ from 'lodash/fp';
import React, { Fragment, ReactElement, useEffect, useMemo, useState } from 'react';
import { div, h, h2, h3, label, li, span, ul } from 'react-hyperscript-helpers';
import { ActionBar } from 'src/components/ActionBar';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { ButtonOutline, ButtonPrimary, LabeledCheckbox, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { MenuButton } from 'src/components/MenuButton';
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger';
import TopBar from 'src/components/TopBar';
import { StringInput } from 'src/data-catalog/create-dataset/CreateDatasetInputs';
import {
  Cohort,
  createSnapshotAccessRequest,
  createSnapshotBuilderCountRequest,
  DatasetBuilderValue,
  DomainConceptSet,
  domainOptionToConceptSet,
  formatCount,
  PrepackagedConceptSet,
} from 'src/dataset-builder/DatasetBuilderUtils';
import { DomainCriteriaSearch } from 'src/dataset-builder/DomainCriteriaSearch';
import {
  DataRepo,
  DatasetBuilderType,
  SnapshotAccessRequestResponse,
  SnapshotBuilderCountResponse,
  SnapshotBuilderDatasetConceptSet as ConceptSet,
  SnapshotBuilderFeatureValueGroup as FeatureValueGroup,
  SnapshotBuilderSettings,
} from 'src/libs/ajax/DataRepo';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { useOnMount } from 'src/libs/react-utils';
import { validate } from 'validate.js';

import { CohortEditor } from './CohortEditor';
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

export interface HeaderAndValues<T extends DatasetBuilderType> {
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
  headerAction?: any;
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

  return li({ style: { width: '45%', ...style } }, [
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
        ButtonOutline,
        {
          style: { borderRadius: 0, fill: 'white', textTransform: 'none' },
          onClick: () => setCreatingCohort(true),
          'aria-haspopup': 'dialog',
        },
        ['Find participants']
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
      header: 'Select participants',
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
  onChange,
}: {
  conceptSets: DomainConceptSet[];
  prepackagedConceptSets?: PrepackagedConceptSet[];
  selectedConceptSets: HeaderAndValues<ConceptSet>[];
  updateConceptSets: Updater<DomainConceptSet[]>;
  onChange: (conceptSets: HeaderAndValues<ConceptSet>[]) => void;
  onStateChange: OnStateChangeHandler;
}) => {
  return h(Selector<ConceptSet>, {
    number: 2,
    onChange,
    objectSets: [
      { header: '', values: conceptSets },
      { header: '', values: prepackagedConceptSets ?? [] },
    ],
    selectedObjectSets: selectedConceptSets,
    header: 'Select data about participants',
    subheader: 'Which information to include about participants',
    style: { marginLeft: '1rem' },
  });
};

interface RequestAccessModalProps {
  onDismiss: () => void;
  snapshotId: string;
}

const RequestAccessModal = (props: RequestAccessModalProps) => {
  const { onDismiss, snapshotId } = props;

  return h(
    Modal,
    {
      title: 'Access request created in Terra',
      showX: false,
      onDismiss,
      width: 500,
      cancelText: 'Return to AxIN Overview',
      okButton: h(
        ButtonPrimary,
        {
          href: '',
          target: '_blank',
        },
        ['Continue to Form']
      ),
    },
    [
      div({ style: { lineHeight: 1.5 } }, [
        'A request has been generated and may take up to 72 hours for approval. Check your email for a copy of this request. You’ll also be notified via email on approval of the request.',
      ]),
      div(
        {
          style: {
            backgroundColor: colors.accent(0.15),
            color: colors.dark(),
            border: `1px solid ${colors.accent(1.25)}`,
            borderRadius: 10,
            height: 150,
            padding: '1rem',
            marginTop: '1.5rem',
            marginBottom: '2rem',
          },
        },
        [
          div([
            h3({
              style: { marginTop: 5, fontWeight: 600 },
              children: ['Important!'],
            }),
            div(
              {
                style: { display: 'pre-wrap', marginTop: -10, lineHeight: 1.5 },
              },
              [
                span(['Please copy and paste the ']),
                span({ style: { fontWeight: 600 } }, ['Request ID']),
                span([' into the AnalytiXIN form:']),
              ]
            ),
            div({ style: { display: 'flex', marginTop: 20, color: colors.accent(1) } }, [
              div(
                {
                  style: { fontWeight: 700, marginRight: 2 },
                },
                [snapshotId]
              ),
              h(ClipboardButton, {
                'aria-label': 'Copy Request ID to clipboard',
                className: 'cell-hover-only',
                iconSize: 14,
                text: snapshotId,
                tooltip: 'Copy Request ID to clipboard',
              }),
            ]),
          ]),
        ]
      ),
    ]
  );
};

export type DatasetBuilderContentsProps = {
  onStateChange: OnStateChangeHandler;
  updateCohorts: Updater<Cohort[]>;
  updateConceptSets: Updater<DomainConceptSet[]>;
  snapshotId: string;
  snapshotBuilderSettings: SnapshotBuilderSettings;
  cohorts: Cohort[];
  conceptSets: DomainConceptSet[];
};

export const DatasetBuilderContents = ({
  onStateChange,
  updateCohorts,
  updateConceptSets,
  snapshotId,
  snapshotBuilderSettings,
  cohorts,
  conceptSets,
}: DatasetBuilderContentsProps) => {
  const [selectedCohorts, setSelectedCohorts] = useState([] as HeaderAndValues<Cohort>[]);
  const [selectedConceptSets, setSelectedConceptSets] = useState([] as HeaderAndValues<ConceptSet>[]);
  const [selectedValues, setSelectedValues] = useState([] as HeaderAndValues<DatasetBuilderValue>[]);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [snapshotRequestParticipantCount, setSnapshotRequestParticipantCount] =
    useLoadedData<SnapshotBuilderCountResponse>();
  const [snapshotAccessRequest, setSnapshotAccessRequest] = useLoadedData<SnapshotAccessRequestResponse>();

  const allCohorts: Cohort[] = useMemo(() => _.flatMap('values', selectedCohorts), [selectedCohorts]);
  const allConceptSets: ConceptSet[] = useMemo(() => _.flatMap('values', selectedConceptSets), [selectedConceptSets]);

  const requestValid = allCohorts.length > 0 && allConceptSets.length > 0;

  useEffect(() => {
    requestValid &&
      setSnapshotRequestParticipantCount(
        withErrorReporting(`Error fetching snapshot builder count for snapshot ${snapshotId}`)(async () =>
          DataRepo().snapshot(snapshotId).getSnapshotBuilderCount(createSnapshotBuilderCountRequest(allCohorts))
        )
      );
  }, [snapshotId, selectedValues, setSnapshotRequestParticipantCount, allCohorts, allConceptSets, requestValid]);

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

  const createHeaderAndValuesFromFeatureValueGroups = (
    featureValueGroups: string[]
  ): HeaderAndValues<DatasetBuilderValue>[] =>
    _.flow(
      _.filter((featureValueGroup: FeatureValueGroup) => _.includes(featureValueGroup.name, featureValueGroups)),
      _.map((featureValueGroup: FeatureValueGroup) => ({
        header: featureValueGroup.name,
        values: _.map((value) => ({ name: value }), featureValueGroup.values),
      }))
    )(snapshotBuilderSettings.featureValueGroups);

  return h(Fragment, [
    div({ style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }, [
      h(BuilderPageHeader, [
        h2(['Data Snapshots']),
        div(['Build a snapshot by selecting the participants and data for one or more of your cohorts.']),
        div({ style: { marginTop: '5px', whiteSpace: 'pre-line' } }, [
          'Then, request access in order to export the data snapshot to a Terra Workspace, where you can perform your analysis.',
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
            // all domain concept sets
            conceptSets: _.map(domainOptionToConceptSet, snapshotBuilderSettings.domainOptions),
            // all prepackaged concept sets
            prepackagedConceptSets: snapshotBuilderSettings.datasetConceptSets,
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
            },
            onStateChange,
          }),
        ]),
      ]),
      requestValid &&
        h(ActionBar, {
          prompt: h(Fragment, [
            snapshotRequestParticipantCount.status === 'Ready'
              ? formatCount(snapshotRequestParticipantCount.state.result.total)
              : h(Spinner),
            ' participants in this dataset',
          ]),
          actionText: 'Request this data snapshot',
          onClick: () => {
            setSnapshotAccessRequest(
              withErrorReporting('Error creating dataset request')(
                async () =>
                  await DataRepo()
                    .snapshotAccessRequest()
                    .createSnapshotAccessRequest(
                      createSnapshotAccessRequest(
                        '',
                        '',
                        snapshotId,
                        cohorts,
                        conceptSets,
                        _.map(
                          (valuesSet: HeaderAndValues<DatasetBuilderValue>) => ({
                            domain: valuesSet.header,
                            values: valuesSet.values,
                          }),
                          selectedValues // convert from HeaderAndValues<DatasetBuilderType>[] to ValueSet[]
                        )
                      )
                    )
              )
            );
            setRequestingAccess(true);
          },
        }),
    ]),
    snapshotAccessRequest.status === 'Loading'
      ? spinnerOverlay
      : snapshotAccessRequest.status === 'Ready' &&
        requestingAccess &&
        h(RequestAccessModal, {
          onDismiss: () => {
            setRequestingAccess(false);
            Nav.goToPath('dataset-builder-details', { snapshotId });
          },
          snapshotId: snapshotAccessRequest.state.id,
        }),
  ]);
};

interface DatasetBuilderProps {
  snapshotId: string;
  initialState?: AnyDatasetBuilderState;
}

const editorBackgroundColor = colors.light(0.7);

let criteriaCount = 1;

export const DatasetBuilderView: React.FC<DatasetBuilderProps> = (props) => {
  const { snapshotId, initialState } = props;
  const [snapshotRoles, loadSnapshotRoles] = useLoadedData<string[]>();
  const [snapshotBuilderSettings, loadSnapshotBuilderSettings] = useLoadedData<SnapshotBuilderSettings>();
  const [datasetBuilderState, setDatasetBuilderState] = useState<AnyDatasetBuilderState>(
    initialState || homepageState.new()
  );
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [conceptSets, setConceptSets] = useState<DomainConceptSet[]>([]);
  const onStateChange = setDatasetBuilderState;

  const getNextCriteriaIndex = () => {
    criteriaCount++;
    return criteriaCount;
  };

  useOnMount(() => {
    void loadSnapshotBuilderSettings(
      withErrorReporting(`Error fetching snapshot builder settings for snapshot ${snapshotId}`)(async () =>
        DataRepo().snapshot(snapshotId).getSnapshotBuilderSettings()
      )
    );
    void loadSnapshotRoles(
      withErrorReporting(`Error fetching roles for snapshot ${snapshotId}`)(async () =>
        DataRepo().snapshot(snapshotId).roles()
      )
    );
  });

  useEffect(() => {
    if (snapshotRoles.status === 'Ready' && !_.contains('aggregate_data_reader', snapshotRoles.state)) {
      Nav.goToPath('dataset-builder-details', { snapshotId });
    }
  }, [snapshotRoles, snapshotId]);

  return snapshotRoles.status === 'Ready' && snapshotBuilderSettings.status === 'Ready'
    ? h(FooterWrapper, [
        h(TopBar, { title: 'Preview', href: '' }, []),
        h(DatasetBuilderHeader, { snapshotId }),
        div({ style: { backgroundColor: editorBackgroundColor } }, [
          (() => {
            switch (datasetBuilderState.mode) {
              case 'homepage':
                return h(DatasetBuilderContents, {
                  onStateChange,
                  updateCohorts: setCohorts,
                  updateConceptSets: setConceptSets,
                  snapshotId,
                  snapshotBuilderSettings: snapshotBuilderSettings.state,
                  cohorts,
                  conceptSets,
                });
              case 'cohort-editor':
                return h(CohortEditor, {
                  onStateChange,
                  originalCohort: datasetBuilderState.cohort,
                  snapshotId,
                  snapshotBuilderSettings: snapshotBuilderSettings.state,
                  updateCohorts: setCohorts,
                  getNextCriteriaIndex,
                });
              case 'domain-criteria-selector':
                return h(DomainCriteriaSelector, {
                  state: datasetBuilderState,
                  onStateChange,
                  snapshotId,
                  getNextCriteriaIndex,
                });
              case 'domain-criteria-search':
                return h(DomainCriteriaSearch, {
                  state: datasetBuilderState,
                  onStateChange,
                  snapshotId,
                  getNextCriteriaIndex,
                });
              default:
                return datasetBuilderState;
            }
          })(),
        ]),
        div({ style: { backgroundColor: editorBackgroundColor, height: '100%' } }, []),
      ])
    : spinnerOverlay;
};
