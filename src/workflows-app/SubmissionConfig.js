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
import * as Utils from 'src/libs/utils';
import { maybeParseJSON } from 'src/libs/utils';
import HelpfulLinksBox from 'src/workflows-app/components/HelpfulLinksBox';
import InputsTable from 'src/workflows-app/components/InputsTable';
import OutputsTable from 'src/workflows-app/components/OutputsTable';
import RecordsTable from 'src/workflows-app/components/RecordsTable';
import { convertArrayType, loadAppUrls, validateInputs, WdsPollInterval } from 'src/workflows-app/components/submission-common';
import ViewWorkflowScriptModal from 'src/workflows-app/components/ViewWorkflowScriptModal';
import { convertToRawUrl } from 'src/workflows-app/utils/method-common';
import { convertArrayType, loadAppUrls, validateInputs, WdsPollInterval } from 'src/workflows-app/utils/submission-utils';
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
  const [wdsProxyUrl, setWdsProxyUrl] = useState({ status: 'None', state: '' });

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
  const errorMessageCount = _.filter((message) => message.type === 'error')(inputValidations).length;

  // TODO: this should probably be moved to a scope more local to the data selector
  const [recordsTableSort, setRecordsTableSort] = useState({ field: 'id', direction: 'asc' });

  const loadAppProxyUrls = useCallback(async () => {
    const { wds: wdsProxyUrlResponse, cbas: cbasProxyUrlResponse } = await loadAppUrls(workspaceId);
    setWdsProxyUrl(wdsProxyUrlResponse);
    return { wdsProxyUrlResponse, cbasProxyUrlResponse };
  }, [workspaceId]);

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

  const loadMethodsData = async (cbasUrlRoot, methodId, methodVersionId) => {
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
  };

  const loadRunSet = async (cbasUrlRoot) => {
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
  };

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
    async ({ wdsProxyUrlState, recordType, includeLoadRecordTypes = true }) => {
      try {
        // try to load WDS proxy URL if one doesn't exist
        if (!wdsProxyUrlState || wdsProxyUrlState.status !== 'Ready') {
          const {
            wdsProxyUrlResponse: { status, state: wdsUrlRoot },
          } = await loadAppProxyUrls();
          if (status === 'Unauthorized') {
            notify('warn', 'Error loading data tables', {
              detail: 'Service returned Unauthorized error. Session might have expired. Please close the tab and re-open it.',
            });
          } else if (wdsUrlRoot) {
            if (includeLoadRecordTypes) {
              await loadRecordTypes(wdsUrlRoot);
            }
            await loadRecordsData(recordType, wdsUrlRoot);
          } else {
            const errorDetails = await (wdsUrlRoot instanceof Response ? wdsUrlRoot.text() : wdsUrlRoot);
            // to avoid stacked warning banners due to auto-poll for WDS url, we remove the current banner at 29th second
            notify('warn', 'Error loading data tables', {
              detail: `Data Table app not found. Will retry in 30 seconds. Error details: ${errorDetails}`,
              timeout: WdsPollInterval - 1000,
            });
          }
        } else {
          // if we have the WDS proxy URL load the WDS data
          const wdsUrlRoot = wdsProxyUrlState.state;
          if (includeLoadRecordTypes) {
            await loadRecordTypes(wdsUrlRoot);
          }
          await loadRecordsData(recordType, wdsUrlRoot);
        }
      } catch (error) {
        notify('error', 'Error loading data tables', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [loadRecordsData, loadRecordTypes, loadAppProxyUrls]
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

  useOnMount(async () => {
    const {
      cbasProxyUrlResponse: { status, state: cbasUrlRoot },
      wdsProxyUrlResponse,
    } = await loadAppProxyUrls();

    if (status === 'Unauthorized') {
      notify('warn', 'Error loading workflows app', {
        detail: 'Service returned Unauthorized error. Session might have expired. Please refresh the page or login again.',
      });
    } else if (cbasUrlRoot) {
      loadRunSet(cbasUrlRoot).then((runSet) => {
        setRunSetRecordType(runSet.record_type);
        loadMethodsData(cbasUrlRoot, runSet.method_id, runSet.method_version_id);
        loadWdsData({ wdsProxyUrlState: wdsProxyUrlResponse, recordType: runSetRecordType });
      });
    }
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
    // Start polling if we're missing WDS proxy url and stop polling when we have it
    if ((!wdsProxyUrl || wdsProxyUrl.status !== 'Ready') && wdsProxyUrl.status !== 'Unauthorized' && !pollWdsInterval.current) {
      pollWdsInterval.current = setInterval(() => loadWdsData({ wdsProxyUrlState: wdsProxyUrl, recordType: runSetRecordType }), WdsPollInterval);
    } else if (!!wdsProxyUrl && wdsProxyUrl.status === 'Ready' && pollWdsInterval.current) {
      clearInterval(pollWdsInterval.current);
      pollWdsInterval.current = undefined;
    }

    return () => {
      clearInterval(pollWdsInterval.current);
      pollWdsInterval.current = undefined;
    };
  }, [loadWdsData, wdsProxyUrl, runSetRecordType]);

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
              loadWdsData({ wdsProxyUrlState: wdsProxyUrl, recordType: value, includeLoadRecordTypes: false });
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
          recordsTableSort,
          setRecordsTableSort,
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
