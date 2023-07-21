import _ from 'lodash/fp';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { a, div, h, h2, span } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link, Select } from 'src/components/common';
import { styles as errorStyles } from 'src/components/ErrorView';
import { centeredSpinner, icon } from 'src/components/icons';
import { TextArea, TextInput } from 'src/components/input';
import Modal from 'src/components/Modal';
import StepButtons from 'src/components/StepButtons';
import { TextCell } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { workflowsAppStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { maybeParseJSON } from 'src/libs/utils';
import HelpfulLinksBox from 'src/workflows-app/components/HelpfulLinksBox';
import InputsTable from 'src/workflows-app/components/InputsTable';
import OutputsTable from 'src/workflows-app/components/OutputsTable';
import RecordsTable from 'src/workflows-app/components/RecordsTable';
import ViewWorkflowScriptModal from 'src/workflows-app/components/ViewWorkflowScriptModal';
import { doesAppProxyUrlExist, loadAppUrls } from 'src/workflows-app/utils/app-utils';
import { convertToRawUrl } from 'src/workflows-app/utils/method-common';
import { CbasPollInterval, convertArrayType, validateInputs, WdsPollInterval } from 'src/workflows-app/utils/submission-utils';
import { wrapWorkflowsPage } from 'src/workflows-app/WorkflowsContainer';

export const BaseSubmissionConfig = (
  {
    methodId,
    name,
    namespace,
    workspace: {
      workspace: { workspaceId },
    },
  },
  _ref
) => {
  const [activeTab, setActiveTab] = useState({ key: 'select-data' });
  const [recordTypes, setRecordTypes] = useState();
  const [method, setMethod] = useState();
  const [availableMethodVersions, setAvailableMethodVersions] = useState();
  const [selectedMethodVersion, setSelectedMethodVersion] = useState();
  const [records, setRecords] = useState([]);
  const [dataTableColumnWidths, setDataTableColumnWidths] = useState({});
  const [loading, setLoading] = useState(false);
  const [workflowScript, setWorkflowScript] = useState();
  const [runSetRecordType, setRunSetRecordType] = useState();

  // Options chosen on this page:
  const [selectedRecordType, setSelectedRecordType] = useState();
  const [selectedRecords, setSelectedRecords] = useState({});
  const [configuredInputDefinition, setConfiguredInputDefinition] = useState([]);
  const [configuredOutputDefinition, setConfiguredOutputDefinition] = useState();
  const [inputValidations, setInputValidations] = useState([]);
  const [viewWorkflowScriptModal, setViewWorkflowScriptModal] = useState(false);

  const [runSetName, setRunSetName] = useState('');
  const [runSetDescription, setRunSetDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflowSubmissionError, setWorkflowSubmissionError] = useState();

  const [displayLaunchModal, setDisplayLaunchModal] = useState(false);
  const [noRecordTypeData, setNoRecordTypeData] = useState(null);

  const dataTableRef = useRef();
  const signal = useCancellation();
  const pollWdsInterval = useRef();
  const pollCbasInterval = useRef();
  const errorMessageCount = _.filter((message) => message.type === 'error')(inputValidations).length;
  const cbasReady = doesAppProxyUrlExist(workspaceId, 'cbasProxyUrlState');
  const wdsReady = doesAppProxyUrlExist(workspaceId, 'wdsProxyUrlState');

  const loadRecordsData = useCallback(
    async (recordType, wdsUrlRoot) => {
      try {
        const searchResult = await Ajax(signal).WorkspaceData.queryRecords(wdsUrlRoot, workspaceId, recordType);
        setRecords(searchResult.records);
      } catch (error) {
        if (recordType === undefined) {
          setNoRecordTypeData('Select a data table');
        } else {
          setNoRecordTypeData(`Data table not found: ${recordType}`);
        }
      }
    },
    [signal, workspaceId]
  );

  const loadMethodsData = useCallback(
    async (cbasUrlRoot, methodId, methodVersionId) => {
      try {
        const methodsResponse = await Ajax(signal).Cbas.methods.getById(cbasUrlRoot, methodId);
        const method = methodsResponse.methods[0];
        if (method) {
          const selectedVersion = _.filter((mv) => mv.method_version_id === methodVersionId, method.method_versions)[0];
          setMethod(method);
          setAvailableMethodVersions(method.method_versions);
          setSelectedMethodVersion(selectedVersion);
        } else {
          notify('error', 'Error loading methods data', { detail: 'Method not found.' });
        }
      } catch (error) {
        notify('error', 'Error loading methods data', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [signal]
  );

  const loadRunSet = useCallback(
    async (cbasUrlRoot) => {
      try {
        const runSet = await Ajax(signal).Cbas.runSets.getForMethod(cbasUrlRoot, methodId, 1);
        const newRunSetData = runSet.run_sets[0];

        setConfiguredInputDefinition(maybeParseJSON(newRunSetData.input_definition));
        setConfiguredOutputDefinition(maybeParseJSON(newRunSetData.output_definition));
        setSelectedRecordType(newRunSetData.record_type);

        return newRunSetData;
      } catch (error) {
        notify('error', 'Error loading run set data', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [methodId, signal]
  );

  const loadRecordTypes = useCallback(
    async (wdsUrlRoot) => {
      try {
        setRecordTypes(await Ajax(signal).WorkspaceData.describeAllRecordTypes(wdsUrlRoot, workspaceId));
      } catch (error) {
        notify('error', 'Error loading data types', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [signal, workspaceId]
  );

  const loadWdsData = useCallback(
    async ({ wdsProxyUrlDetails, recordType, includeLoadRecordTypes = true }) => {
      try {
        // try to load WDS proxy URL if one doesn't exist
        if (wdsProxyUrlDetails.status !== 'Ready') {
          const { wdsProxyUrlState } = await loadAppUrls(workspaceId);
          // update only WDS proxy url state. CBAS proxy url will be updated during its own separate scheduled poll
          workflowsAppStore.update((state) => ({ ...state, workspaceId, wdsProxyUrlState }));

          if (wdsProxyUrlState.status === 'Ready') {
            if (includeLoadRecordTypes) {
              await loadRecordTypes(wdsProxyUrlState.state);
            }
            await loadRecordsData(recordType, wdsProxyUrlState.state);
          } else {
            const wdsUrlState = wdsProxyUrlState.state;
            const errorDetails = await (wdsUrlState instanceof Response ? wdsUrlState.text() : wdsUrlState);
            const additionalDetails = errorDetails ? `Error details: ${errorDetails}` : '';
            // to avoid stacked warning banners due to auto-poll for WDS url, we remove the current banner at 29th second
            notify('warn', 'Error loading data tables', {
              detail: `Data Table app not found. Will retry in 30 seconds. ${additionalDetails}`,
              timeout: WdsPollInterval - 1000,
            });
          }
        } else {
          // if we have the WDS proxy URL load the WDS data
          const wdsUrlRoot = wdsProxyUrlDetails.state;
          if (includeLoadRecordTypes) {
            await loadRecordTypes(wdsUrlRoot);
          }
          await loadRecordsData(recordType, wdsUrlRoot);
        }
      } catch (error) {
        notify('error', 'Error loading data tables', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [loadRecordsData, loadRecordTypes, workspaceId]
  );

  const loadConfigData = useCallback(
    async (cbasProxyUrlDetails, wdsProxyUrlDetails) => {
      try {
        // try to load CBAS proxy url if one doesn't exist
        if (cbasProxyUrlDetails.status !== 'Ready') {
          const { wdsProxyUrlState, cbasProxyUrlState, cromwellProxyUrlState } = await loadAppUrls(workspaceId);

          // we update states of WDS proxy url as well since it is used in loadWdsData call below
          workflowsAppStore.set({
            workspaceId,
            wdsProxyUrlState,
            cbasProxyUrlState,
            cromwellProxyUrlState,
          });

          if (cbasProxyUrlState.status === 'Ready') {
            loadRunSet(cbasProxyUrlState.state).then((runSet) => {
              setRunSetRecordType(runSet.record_type);
              loadMethodsData(cbasProxyUrlState.state, runSet.method_id, runSet.method_version_id);
              loadWdsData({ wdsProxyUrlDetails: wdsProxyUrlState, recordType: runSetRecordType });
            });
          } else {
            const cbasUrlState = cbasProxyUrlState.state;
            const errorDetails = await (cbasUrlState instanceof Response ? cbasUrlState.text() : cbasUrlState);
            const additionalDetails = errorDetails ? `Error details: ${errorDetails}` : '';
            // to avoid stacked warning banners due to auto-poll for CBAS url, we remove the current banner at 29th second
            notify('warn', 'Error loading Workflows app', {
              detail: `Workflows app not found. Will retry in 30 seconds. ${additionalDetails}`,
              timeout: CbasPollInterval - 1000,
            });
          }
        } else {
          loadRunSet(cbasProxyUrlDetails.state).then((runSet) => {
            setRunSetRecordType(runSet.record_type);
            loadMethodsData(cbasProxyUrlDetails.state, runSet.method_id, runSet.method_version_id);
            loadWdsData({ wdsProxyUrlDetails, recordType: runSetRecordType });
          });
        }
      } catch (error) {
        notify('error', 'Error loading Workflows app', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [loadMethodsData, loadRunSet, loadWdsData, runSetRecordType, workspaceId]
  );

  const updateRunSetName = () => {
    const timestamp = new Date().toISOString().slice(0, -5); // slice off milliseconds at the end for readability.
    if (runSetName === '') {
      setRunSetName(`${_.kebabCase(method.name)}_${_.kebabCase(selectedRecordType)}_${timestamp}`);
    }
  };

  const submitRun = async () => {
    try {
      const runSetsPayload = {
        run_set_name: runSetName,
        run_set_description: runSetDescription,
        method_version_id: selectedMethodVersion.method_version_id,
        workflow_input_definitions: _.map(convertArrayType)(configuredInputDefinition),
        workflow_output_definitions: configuredOutputDefinition,
        wds_records: {
          record_type: selectedRecordType,
          record_ids: _.keys(selectedRecords),
        },
      };

      setIsSubmitting(true);
      const runSetObject = await Ajax(signal).Cbas.runSets.post(runSetsPayload);
      notify('success', 'Workflow successfully submitted', {
        message: 'You may check on the progress of workflow on this page anytime.',
        timeout: 5000,
      });
      Nav.goToPath('submission-details', {
        submissionId: runSetObject.run_set_id,
      });
    } catch (error) {
      setIsSubmitting(false);
      setWorkflowSubmissionError(JSON.stringify(error instanceof Response ? await error.json() : error, null, 2));
    }
  };

  useOnMount(() => {
    const loadWorkflowsApp = async () => {
      if (!cbasReady || !wdsReady) {
        const { wdsProxyUrlState, cbasProxyUrlState, cromwellProxyUrlState } = await loadAppUrls(workspaceId);

        workflowsAppStore.set({
          workspaceId,
          wdsProxyUrlState,
          cbasProxyUrlState,
          cromwellProxyUrlState,
        });

        if (cbasProxyUrlState.status === 'Ready') {
          loadRunSet(cbasProxyUrlState.state).then((runSet) => {
            setRunSetRecordType(runSet.record_type);
            loadMethodsData(cbasProxyUrlState.state, runSet.method_id, runSet.method_version_id);
            loadWdsData({ wdsProxyUrlDetails: wdsProxyUrlState, recordType: runSetRecordType });
          });
        }
      } else {
        const cbasProxyUrlDetails = workflowsAppStore.get().cbasProxyUrlState;

        loadRunSet(cbasProxyUrlDetails.state).then((runSet) => {
          setRunSetRecordType(runSet.record_type);
          loadMethodsData(cbasProxyUrlDetails.state, runSet.method_id, runSet.method_version_id);
          loadWdsData({ wdsProxyUrlDetails: workflowsAppStore.get().wdsProxyUrlState, recordType: runSetRecordType });
        });
      }
    };
    loadWorkflowsApp();
  });

  useEffect(() => {
    // inspect input configuration and selected data table to find required inputs without attributes assigned to it
    if (recordTypes && records && records.length && configuredInputDefinition) {
      const selectedDataTable = _.keyBy('name', recordTypes)[records[0].type];
      const dataTableAttributes = _.keyBy('name', selectedDataTable.attributes);

      const newInputValidations = validateInputs(configuredInputDefinition, dataTableAttributes);

      setInputValidations(newInputValidations);
    }
  }, [records, recordTypes, configuredInputDefinition]);

  useEffect(() => {
    dataTableRef.current?.recomputeColumnSizes();
  }, [dataTableColumnWidths, records, recordTypes]);

  useEffect(() => {
    if (method && availableMethodVersions) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [method, availableMethodVersions]);

  useEffect(() => {
    async function getWorkflowScript() {
      try {
        const workflowUrlRaw = await convertToRawUrl(selectedMethodVersion.url, selectedMethodVersion.name, method.source);
        const script = await Ajax(signal).WorkflowScript.get(workflowUrlRaw);
        setWorkflowScript(script);
      } catch (error) {
        notify('error', 'Error loading workflow script', { detail: error instanceof Response ? await error.text() : error });
      }
    }

    if (selectedMethodVersion != null) {
      getWorkflowScript();
    }
  }, [signal, selectedMethodVersion, method]);

  useEffect(() => {
    // Start polling if we're missing CBAS proxy url and stop polling when we have it
    if (!cbasReady && !pollCbasInterval.current) {
      pollCbasInterval.current = setInterval(
        () => loadConfigData(workflowsAppStore.get().cbasProxyUrlState, workflowsAppStore.get().wdsProxyUrlState),
        CbasPollInterval
      );
    } else if (cbasReady && pollCbasInterval.current) {
      clearInterval(pollCbasInterval.current);
      pollCbasInterval.current = undefined;
    }

    return () => {
      clearInterval(pollCbasInterval.current);
      pollCbasInterval.current = undefined;
    };
  }, [loadConfigData, cbasReady]);

  useEffect(() => {
    // Start polling if we're missing WDS proxy url and stop polling when we have it
    if (!wdsReady && !pollWdsInterval.current) {
      pollWdsInterval.current = setInterval(
        () => loadWdsData({ wdsProxyUrlDetails: workflowsAppStore.get().wdsProxyUrlState, recordType: runSetRecordType }),
        WdsPollInterval
      );
    } else if (wdsReady && pollWdsInterval.current) {
      clearInterval(pollWdsInterval.current);
      pollWdsInterval.current = undefined;
    }

    return () => {
      clearInterval(pollWdsInterval.current);
      pollWdsInterval.current = undefined;
    };
  }, [loadWdsData, runSetRecordType, wdsReady]);

  const renderSummary = () => {
    return div({ style: { marginLeft: '2em', marginTop: '1rem', display: 'flex', justifyContent: 'space-between' } }, [
      div([
        h(
          Link,
          {
            onClick: () =>
              Nav.goToPath('workspace-workflows-app', {
                name,
                namespace,
                workspace: {
                  workspace: { workspaceId },
                },
              }),
            style: { display: 'inline-flex', alignItems: 'center', padding: '0.5rem 0 0' },
          },
          [icon('arrowLeft', { style: { marginRight: '0.5rem' } }), 'Back to workflows']
        ),
        div([h2([method ? `Submission Configuration for ${method.name}` : 'loading'])]),
        div({ style: { lineHeight: 2.0 } }, [
          div([
            span({ style: { fontWeight: 'bold' } }, ['Workflow Version: ']),
            availableMethodVersions
              ? h(Select, {
                  isDisabled: false,
                  'aria-label': 'Select a workflow version',
                  isClearable: false,
                  value: selectedMethodVersion ? selectedMethodVersion.name : null,
                  onChange: ({ value }) => {
                    setSelectedMethodVersion(_.find((m) => m.name === value, availableMethodVersions));
                  },
                  placeholder: 'None',
                  styles: { container: (old) => ({ ...old, display: 'inline-block', width: 325, marginLeft: 20 }) },
                  options: _.map((m) => m.name, availableMethodVersions),
                })
              : 'Fetching available workflow versions...',
          ]),
          div([
            span({ style: { fontWeight: 'bold' } }, ['Workflow source URL: ']),
            selectedMethodVersion ? selectedMethodVersion.url : 'No workflow version selected',
          ]),
          div([
            h(
              Link,
              {
                disabled: workflowScript == null,
                onClick: () => setViewWorkflowScriptModal(true),
              },
              'View Workflow Script'
            ),
          ]),
        ]),
        div({ style: { marginTop: '2rem', height: '2rem', fontWeight: 'bold' } }, ['Select a data table']),
        div({}, [
          h(Select, {
            isDisabled: false,
            'aria-label': 'Select a data table',
            isClearable: false,
            value: selectedRecordType || null,
            onChange: ({ value }) => {
              setNoRecordTypeData(null);
              setSelectedRecordType(value);
              setSelectedRecords(null);
              loadWdsData({ wdsProxyUrlDetails: workflowsAppStore.get().wdsProxyUrlState, recordType: value, includeLoadRecordTypes: false });
            },
            placeholder: 'None selected',
            styles: { container: (old) => ({ ...old, display: 'inline-block', width: 200 }), paddingRight: '2rem' },
            options: _.map((t) => t.name, recordTypes),
          }),
          noRecordTypeData &&
            h(Fragment, [
              a(
                {
                  'aria-label': 'warning message',
                  style: { marginLeft: '1rem', fontSize: 15, marginTop: '1rem', height: '2rem', fontWeight: 'bold' },
                },
                [
                  icon('error-standard', {
                    size: 20,
                    style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' },
                  }),
                  noRecordTypeData,
                ]
              ),
            ]),
        ]),
        h(StepButtons, {
          tabs: [
            { key: 'select-data', title: 'Select Data', isValid: true },
            { key: 'inputs', title: 'Inputs', isValid: errorMessageCount === 0 },
            { key: 'outputs', title: 'Outputs', isValid: true },
          ],
          activeTab: activeTab.key || 'select-data',
          onChangeTab: (v) => setActiveTab({ key: v }),
          finalStep: h(
            ButtonPrimary,
            {
              'aria-label': 'Submit button',
              style: { marginLeft: '1rem' },
              disabled: _.isEmpty(selectedRecords) || errorMessageCount > 0,
              tooltip: Utils.cond(
                [_.isEmpty(selectedRecords), () => 'No records selected'],
                [errorMessageCount > 0, () => `${errorMessageCount} input(s) have missing/invalid values`],
                () => ''
              ),
              onClick: () => {
                updateRunSetName();
                setDisplayLaunchModal(true);
              },
            },
            ['Submit']
          ),
        }),
        displayLaunchModal &&
          h(
            Modal,
            {
              title: 'Send submission',
              width: 600,
              onDismiss: () => {
                if (!isSubmitting) {
                  setDisplayLaunchModal(false);
                  setWorkflowSubmissionError(undefined);
                }
              },
              showCancel: !isSubmitting,
              okButton: h(
                ButtonPrimary,
                {
                  disabled: isSubmitting,
                  'aria-label': 'Launch Submission',
                  onClick: () => submitRun(),
                },
                [isSubmitting ? 'Submitting...' : 'Submit']
              ),
            },
            [
              div({ style: { lineHeight: 2.0 } }, [
                h(TextCell, { style: { marginTop: '1.5rem', fontSize: 16, fontWeight: 'bold' } }, ['Submission name']),
                h(TextInput, {
                  disabled: isSubmitting,
                  'aria-label': 'Submission name',
                  value: runSetName,
                  onChange: setRunSetName,
                  placeholder: 'Enter submission name',
                }),
              ]),
              div({ style: { lineHeight: 2.0, marginTop: '1.5rem' } }, [
                span({ style: { fontSize: 16, fontWeight: 'bold' } }, ['Comment ']),
                '(optional)',
                h(TextArea, {
                  style: { height: 200, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
                  'aria-label': 'Enter a comment',
                  disabled: isSubmitting,
                  value: runSetDescription,
                  onChange: setRunSetDescription,
                  placeholder: 'Enter comments',
                }),
              ]),
              div({ style: { lineHeight: 2.0, marginTop: '1.5rem' } }, [
                div([h(TextCell, ['This will launch ', span({ style: { fontWeight: 'bold' } }, [_.keys(selectedRecords).length]), ' workflow(s).'])]),
                h(TextCell, { style: { marginTop: '1rem' } }, ['Running workflows will generate cloud compute charges.']),
                workflowSubmissionError &&
                  div([
                    div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
                      icon('warning-standard', { size: 16, style: { color: colors.danger() } }),
                      h(TextCell, { style: { marginLeft: '0.5rem' } }, ['Error submitting workflow:']),
                    ]),
                    div(
                      {
                        style: { ...errorStyles.jsonFrame, overflowY: 'scroll', maxHeight: 160 },
                        'aria-label': 'Modal submission error',
                      },
                      [workflowSubmissionError]
                    ),
                  ]),
              ]),
            ]
          ),
        viewWorkflowScriptModal &&
          h(ViewWorkflowScriptModal, {
            workflowScript,
            onDismiss: () => setViewWorkflowScriptModal(false),
          }),
      ]),
      method && div({ style: { marginRight: '1em' } }, [h(HelpfulLinksBox, { method })]),
    ]);
  };

  const renderInputs = () => {
    return configuredInputDefinition && recordTypes && records.length
      ? h(InputsTable, {
          selectedDataTable: _.keyBy('name', recordTypes)[selectedRecordType],
          configuredInputDefinition,
          setConfiguredInputDefinition,
          inputValidations,
        })
      : 'No data table rows available or input definition is not configured...';
  };

  const renderOutputs = () => {
    return configuredOutputDefinition
      ? h(OutputsTable, {
          configuredOutputDefinition,
          setConfiguredOutputDefinition,
        })
      : 'No previous run set data...';
  };

  const renderRecordSelector = () => {
    return recordTypes && records.length
      ? h(RecordsTable, {
          dataTableColumnWidths,
          setDataTableColumnWidths,
          dataTableRef,
          records,
          selectedRecords,
          setSelectedRecords,
          selectedDataTable: _.keyBy('name', recordTypes)[selectedRecordType || records[0].type],
        })
      : 'No data table rows selected...';
  };

  return loading
    ? centeredSpinner()
    : h(Fragment, [
        div(
          {
            style: {
              borderBottom: '2px solid rgb(116, 174, 67)',
              boxShadow: 'rgb(0 0 0 / 26%) 0px 2px 5px 0px, rgb(0 0 0 / 16%) 0px 2px 10px 0px',
              position: 'relative',
            },
          },
          [renderSummary()]
        ),
        div(
          {
            style: {
              display: 'flex',
              flex: '1 1 auto',
              flexDirection: 'column',
              padding: '1rem 3rem',
            },
          },
          [
            Utils.switchCase(
              activeTab.key || 'select-data',
              ['select-data', () => renderRecordSelector()],
              ['inputs', () => renderInputs()],
              ['outputs', () => renderOutputs()]
            ),
          ]
        ),
      ]);
};

export const SubmissionConfig = wrapWorkflowsPage({ name: 'SubmissionConfig' })(BaseSubmissionConfig);

export const navPaths = [
  {
    name: 'workspace-workflows-app-submission-config',
    path: '/workspaces/:namespace/:name/workflows-app/submission-config/:methodId',
    component: SubmissionConfig,
    title: ({ name }) => `${name} - Submission Config`,
  },
];
