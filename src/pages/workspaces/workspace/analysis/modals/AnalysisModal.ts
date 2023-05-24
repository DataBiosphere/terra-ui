import _ from 'lodash/fp';
import React, { Fragment, ReactElement, useState } from 'react';
import { div, h, h2, hr, img, span } from 'react-hyperscript-helpers';
import { ButtonPrimary, Clickable, Select, spinnerOverlay, useUniqueId } from 'src/components/common';
import Dropzone from 'src/components/Dropzone';
import { icon } from 'src/components/icons';
import ModalDrawer from 'src/components/ModalDrawer';
import TitleBar from 'src/components/TitleBar';
import cromwellImg from 'src/images/cromwell-logo.png';
import galaxyLogo from 'src/images/galaxy-logo.svg';
import hailLogo from 'src/images/hail-logo.svg';
import jupyterLogoLong from 'src/images/jupyter-logo-long.png';
import rstudioBioLogo from 'src/images/r-bio-logo.svg';
import { Ajax } from 'src/libs/ajax';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { AppDataDisk, PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import Events from 'src/libs/events';
import { FormLabel } from 'src/libs/forms';
import { usePrevious, withDisplayName } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import {
  BaseWorkspace,
  CloudProvider,
  cloudProviderTypes,
  getCloudProviderFromWorkspace,
  isGoogleWorkspaceInfo,
} from 'src/libs/workspace-utils';
import { AzureComputeModalBase } from 'src/pages/workspaces/workspace/analysis/modals/AzureComputeModal';
import { ComputeModalBase } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal';
import { CromwellModalBase } from 'src/pages/workspaces/workspace/analysis/modals/CromwellModal';
import { GalaxyModalBase } from 'src/pages/workspaces/workspace/analysis/modals/GalaxyModal';
import { WarningTitle } from 'src/pages/workspaces/workspace/analysis/modals/WarningTitle';
import { AnalysisFileStore } from 'src/pages/workspaces/workspace/analysis/useAnalysisFiles';
import { getCurrentApp } from 'src/pages/workspaces/workspace/analysis/utils/app-utils';
import { getCurrentPersistentDisk } from 'src/pages/workspaces/workspace/analysis/utils/disk-utils';
import { getFileName } from 'src/pages/workspaces/workspace/analysis/utils/file-utils';
import {
  analysisNameInput,
  analysisNameValidator,
  baseRmd,
  notebookData,
} from 'src/pages/workspaces/workspace/analysis/utils/notebook-utils';
import { isResourceDeletable } from 'src/pages/workspaces/workspace/analysis/utils/resource-utils';
import { getCurrentRuntime } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils';
import {
  AppToolLabel,
  appToolLabels,
  cloudAppTools,
  cloudRuntimeTools,
  getToolLabelFromCloudEnv,
  getToolLabelFromFileExtension,
  isAppToolLabel,
  isToolHidden,
  RuntimeToolLabel,
  runtimeToolLabels,
  runtimeTools,
  Tool,
  toolExtensionDisplay,
  ToolLabel,
  tools,
} from 'src/pages/workspaces/workspace/analysis/utils/tool-utils';
import validate from 'validate.js';

const titleId = 'analysis-modal-title';
const analysisMode = Symbol('artifact');
const environmentMode = Symbol('environment');

const StringSelect = Select as typeof Select<string>;

export interface AnalysisModalProps {
  isOpen: boolean;
  workspace: BaseWorkspace;
  location: any;
  runtimes: Runtime[];
  apps: App[];
  appDataDisks: AppDataDisk[];
  persistentDisks: PersistentDisk[];
  onDismiss: () => void;
  onError: () => void;
  onSuccess: () => void;
  openUploader: () => void;
  uploadFiles: (files: File[]) => Promise<unknown>;
  analysisFileStore: AnalysisFileStore;
}

export const AnalysisModal = withDisplayName('AnalysisModal')(
  ({
    isOpen,
    onDismiss,
    onError,
    onSuccess,
    runtimes,
    apps,
    appDataDisks,
    persistentDisks,
    uploadFiles,
    openUploader,
    workspace,
    location,
    analysisFileStore,
  }: AnalysisModalProps) => {
    const [viewMode, setViewMode] = useState<any>();
    const cloudProvider: CloudProvider = getCloudProviderFromWorkspace(workspace);
    const [notebookKernel, setNotebookKernel] = useState('python3');
    const [analysisName, setAnalysisName] = useState('');
    const prevAnalysisName = usePrevious(analysisName);
    const [currentToolObj, setCurrentToolObj] = useState<Tool>();
    const [fileExt, setFileExt] = useState('');
    const currentTool: ToolLabel | undefined = currentToolObj?.label;

    const currentRuntime: Runtime | undefined = getCurrentRuntime(runtimes);
    const currentDisk = getCurrentPersistentDisk(runtimes, persistentDisks);
    const currentRuntimeToolLabel = currentRuntime && getToolLabelFromCloudEnv(currentRuntime);
    const currentApp = (toolLabel: AppToolLabel): App | undefined => getCurrentApp(toolLabel, apps);

    // TODO: Bring in as props from Analyses OR bring entire AnalysisFileStore from props.
    const { loadedState, createAnalysis, pendingCreate } = analysisFileStore;
    // TODO: When the above is done, this check below may not be necessary.
    const analyses = loadedState.status !== 'None' ? loadedState.state : null;
    const status = loadedState.status;
    const resetView = () => {
      setViewMode(undefined);
      setAnalysisName('');
      setCurrentToolObj(undefined);
      setNotebookKernel('python3');
    };

    /**
     * The intended flow is to call this without a viewMode, and have it intelligently figure out the next
     * step for you. Passing a viewMode is a way to force your next modal.
     */
    const enterNextViewMode = (currentTool, baseViewMode = viewMode) => {
      const app = currentApp(currentTool);
      const doesCloudEnvForToolExist = !!(currentRuntimeToolLabel === currentTool || app);
      Utils.switchCase(
        baseViewMode,
        [
          analysisMode,
          () =>
            Utils.cond(
              [doesCloudEnvForToolExist, onSuccess],
              [
                !doesCloudEnvForToolExist && !!currentRuntime && isResourceDeletable('runtime', currentRuntime),
                () => setViewMode(environmentMode),
              ],
              [!doesCloudEnvForToolExist && !currentRuntime, () => setViewMode(environmentMode)],
              [
                !doesCloudEnvForToolExist && !!currentRuntime && !isResourceDeletable('runtime', currentRuntime),
                onSuccess,
              ]
            ),
        ],
        [environmentMode, onSuccess],
        [
          Utils.DEFAULT,
          () =>
            Utils.cond(
              [
                currentTool === runtimeToolLabels.RStudio ||
                  currentTool === runtimeToolLabels.Jupyter ||
                  currentTool === runtimeToolLabels.JupyterLab,
                () => setViewMode(analysisMode),
              ],
              [isAppToolLabel(currentTool) && !app, () => setViewMode(environmentMode)],
              [
                isAppToolLabel(currentTool) && !!app,
                () => {
                  console.error(
                    `This shouldn't be possible, as you aren't allowed to create a ${
                      app ? _.capitalize(app.appType) : 'app'
                    } instance when one exists; the button should be disabled.`
                  );
                  resetView();
                },
              ]
            ),
        ]
      );
    };

    const getView = () =>
      Utils.switchCase(
        viewMode,
        [analysisMode, renderCreateAnalysis],
        [environmentMode, getEnvironmentView],
        [Utils.DEFAULT, renderSelectAnalysisBody]
      );

    const getEnvironmentView = () =>
      Utils.switchCase(
        cloudProvider,
        [cloudProviderTypes.GCP, getGCPEnvironmentView],
        [cloudProviderTypes.AZURE, getAzureEnvironmentView]
      );

    const getGCPEnvironmentView = () =>
      Utils.switchCase(
        currentTool,
        [runtimeToolLabels.Jupyter, renderComputeModal],
        [runtimeToolLabels.RStudio, renderComputeModal],
        [appToolLabels.GALAXY, () => renderAppModal(GalaxyModalBase, appToolLabels.GALAXY)],
        [appToolLabels.CROMWELL, () => renderAppModal(CromwellModalBase, appToolLabels.CROMWELL)]
      );

    const getAzureEnvironmentView = () =>
      Utils.switchCase(currentTool, [runtimeToolLabels.JupyterLab, renderAzureModal]);

    const renderComputeModal = () =>
      h(ComputeModalBase, {
        location,
        workspace,
        tool: currentTool,
        currentRuntime,
        currentDisk,
        onDismiss,
        onError,
        onSuccess,
      });

    const renderAzureModal = () =>
      h(AzureComputeModalBase, {
        location,
        workspace,
        tool: currentTool,
        currentRuntime,
        currentDisk: persistentDisks ? persistentDisks[0] : undefined,
        onDismiss,
        onSuccess,
      });

    const renderAppModal = (appModalBase, toolLabel) =>
      h(appModalBase, {
        isOpen: viewMode === toolLabel,
        workspace,
        apps,
        appDataDisks,
        onDismiss,
        onError,
        onSuccess,
      });

    const styles: Record<string, React.CSSProperties> = {
      toolCard: {
        backgroundColor: 'white',
        borderRadius: 5,
        padding: '1rem',
        display: 'inline-block',
        verticalAlign: 'middle',
        marginBottom: '1rem',
        textAlign: 'center',
        width: '100%',
        height: 60,
      },
      image: { verticalAlign: 'middle', height: 30, width: '40%' },
      hover: { backgroundColor: colors.accent(0.3) },
    };

    const availableRuntimeTools = cloudRuntimeTools[cloudProvider];
    const availableAppTools = cloudAppTools[cloudProvider];

    const currentApps: Record<AppToolLabel, App | undefined> = {
      GALAXY: currentApp(appToolLabels.GALAXY),
      CROMWELL: currentApp(appToolLabels.CROMWELL),
      HAIL_BATCH: currentApp(appToolLabels.HAIL_BATCH),
    };

    const appDisabledMessages: Record<AppToolLabel, string> = {
      GALAXY: 'You already have a Galaxy environment',
      CROMWELL: 'You already have a Cromwell instance',
      HAIL_BATCH: 'You already have a Hail Batch instance',
    };

    const toolImages: Record<AppToolLabel | RuntimeToolLabel, ReactElement<'img'>> = {
      Jupyter: img({ src: jupyterLogoLong, alt: 'Create new notebook', style: _.merge(styles.image, { width: 111 }) }),
      RStudio: img({ src: rstudioBioLogo, alt: 'Create new R file', style: _.merge(styles.image, { width: 207 }) }),
      JupyterLab: img({
        src: jupyterLogoLong,
        alt: 'Create new notebook',
        style: _.merge(styles.image, { width: 111 }),
      }),
      GALAXY: img({ src: galaxyLogo, alt: 'Create new Galaxy app', style: _.merge(styles.image, { width: 139 }) }),
      CROMWELL: img({ src: cromwellImg, alt: 'Create new Cromwell app', style: styles.image }),
      HAIL_BATCH: img({ src: hailLogo, alt: 'Create new Hail Batch app', style: styles.image }),
    };

    const runtimeToolButtons = availableRuntimeTools.map((runtimeTool) => {
      return !isToolHidden(runtimeTool.label, cloudProvider)
        ? h(
            Clickable,
            {
              style: styles.toolCard,
              onClick: () => {
                setCurrentToolObj(runtimeTool);
                setFileExt(runtimeTool.defaultExt);
                enterNextViewMode(runtimeTool.label);
              },
              hover: styles.hover,
              key: runtimeTool.label,
            },
            [toolImages[runtimeTool.label]]
          )
        : '';
    });

    const appToolButtons = availableAppTools.map((appTool) => {
      const currentApp = currentApps[appTool.label];
      return !isToolHidden(appTool.label, cloudProvider)
        ? h(
            Clickable,
            {
              style: {
                opacity: currentApp ? '0.5' : '1',
                ...styles.toolCard,
              },
              onClick: () => {
                setCurrentToolObj(appTool);
                enterNextViewMode(appTool.label);
              },
              hover: !currentApp ? styles.hover : undefined,
              disabled: !!currentApp,
              tooltip: currentApp ? appDisabledMessages[appTool.label] : '',
              key: appTool.label,
            },
            [toolImages[appTool.label]]
          )
        : '';
    });

    const renderToolButtons = () =>
      div(
        {
          style: { display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'space-between' },
        },
        [runtimeToolButtons, appToolButtons]
      );

    const renderSelectAnalysisBody = () =>
      div(
        {
          style: { display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem' },
        },
        [
          renderToolButtons(),
          h(
            Dropzone,
            {
              accept: `.${runtimeTools.Jupyter.ext.join(', .')}, .${runtimeTools.RStudio.ext.join(', .')}`,
              style: { flexGrow: 1, backgroundColor: colors.light(), height: '100%' },
              activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
              onDropRejected: () =>
                reportError(
                  'Not a valid analysis file',
                  `The selected file is not one of the supported types: .${runtimeTools.Jupyter.ext.join(
                    ', .'
                  )}, .${runtimeTools.RStudio.ext.join(', .')}. Ensure your file has the proper extension.`
                ),
              onDropAccepted: (files) => {
                const toolLabel = isGoogleWorkspaceInfo(workspace.workspace)
                  ? getToolLabelFromFileExtension(files.pop().path)
                  : runtimeToolLabels.JupyterLab;
                const tool = toolLabel ? tools[toolLabel] : undefined;
                setCurrentToolObj(tool);
                currentRuntime &&
                !isResourceDeletable('runtime', currentRuntime) &&
                currentRuntimeToolLabel !== toolLabel
                  ? onSuccess()
                  : enterNextViewMode(tool, analysisMode);
                uploadFiles(files);
              },
            },
            [
              () =>
                h(
                  Clickable,
                  {
                    onClick: () => {
                      onSuccess();
                      openUploader();
                    },
                    style: {
                      marginTop: '1rem',
                      fontSize: 16,
                      lineHeight: '20px',
                      ...(Style.elements.card.container as React.CSSProperties),
                      alignItems: 'center',
                      width: '100%',
                      height: 150,
                      backgroundColor: colors.dark(0.1),
                      border: `1px dashed ${colors.dark(0.7)}`,
                      boxShadow: 'none',
                    },
                  },
                  [
                    div(['Or Click / Drag to upload an analysis file']),
                    icon('upload-cloud', {
                      size: 25,
                      style: {
                        opacity: 0.4,
                        marginTop: '0.5rem',
                      },
                    }),
                  ]
                ),
            ]
          ),
        ]
      );

    const getArtifactLabel = (toolLabel) =>
      Utils.switchCase(
        toolLabel,
        [runtimeToolLabels.RStudio, () => 'R file'],
        [runtimeToolLabels.Jupyter, () => 'notebook'],
        [runtimeToolLabels.JupyterLab, () => 'notebook'],
        [
          Utils.DEFAULT,
          () => console.error(`Should not be calling getArtifactLabel for ${toolLabel}, artifacts not implemented`),
        ]
      );

    const renderCreateAnalysis = () =>
      div({ style: { display: 'flex', flexDirection: 'column', flex: 1, padding: '0.5rem 1.5rem 1.5rem 1.5rem' } }, [
        h2({ style: { fontWeight: 600, marginBottom: 0 } }, [`Create a new ${getArtifactLabel(currentTool)}`]),
        renderCreateAnalysisBody(currentTool),
      ]);

    const analysisNameInputId = useUniqueId('analysis-name-input');
    const nameSelectId = useUniqueId('select-language');
    const fileTypeSelect = useUniqueId('select-file-type');

    const renderCreateAnalysisBody = (toolLabel) => {
      const isJupyter = toolLabel === runtimeToolLabels.Jupyter;
      const isRStudio = toolLabel === runtimeToolLabels.RStudio;
      const isJupyterLab = toolLabel === runtimeToolLabels.JupyterLab;
      const errors = validate(
        { analysisName: `${analysisName}.${fileExt}`, notebookKernel },
        {
          analysisName: analysisNameValidator(_.map(({ name }) => getFileName(name), analyses)),
          notebookKernel: { presence: { allowEmpty: true } },
        }
      );
      return div({ style: { display: 'flex', flexDirection: 'column' } }, [
        h(Fragment, [
          h(FormLabel, { htmlFor: analysisNameInputId, required: true }, [
            `Name of the ${getArtifactLabel(toolLabel)}`,
          ]),
          analysisNameInput({
            error: Utils.summarizeErrors(prevAnalysisName !== analysisName && errors?.analysisName),
            inputProps: {
              id: analysisNameInputId,
              value: analysisName,
              onChange: (v) => {
                setAnalysisName(v);
              },
            },
          }),
        ]),
        (isJupyterLab || isJupyter) &&
          h(Fragment, [
            h(FormLabel, { htmlFor: nameSelectId, required: true }, ['Language']),
            h(StringSelect, {
              id: nameSelectId,
              isSearchable: true,
              placeholder: 'Select a language',
              getOptionLabel: ({ value }) => _.startCase(value),
              value: notebookKernel,
              onChange: (opt) => setNotebookKernel(opt!.value),
              options: ['python3', 'r'],
            }),
          ]),
        isRStudio &&
          h(Fragment, [
            h(FormLabel, { htmlFor: fileTypeSelect, required: true }, ['File Type']),
            h(StringSelect, {
              id: fileTypeSelect,
              isSearchable: true,
              value: fileExt,
              onChange: (v) => {
                setFileExt(v!.value);
              },
              options: toolExtensionDisplay.RStudio!,
            }),
          ]),
        (isJupyterLab || isRStudio || isJupyter) &&
          currentRuntime &&
          !isResourceDeletable('runtime', currentRuntime) &&
          currentRuntimeToolLabel !== toolLabel &&
          div({ style: { backgroundColor: colors.warning(0.1), margin: '0.5rem', padding: '1rem' } }, [
            h(WarningTitle, { iconSize: 16 }, [span({ style: { fontWeight: 600 } }, ['Environment Creation'])]),
            div({ style: { marginBottom: '0.5rem', marginTop: '1rem' } }, [
              'You have a non-deletable environment associated with another application.',
            ]),
            div([
              'You may create an analysis, but must wait for your current environment to finish processing and get a suitable environment to run it.',
            ]),
          ]),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(
            ButtonPrimary,
            {
              // TODO: See spinner overlay comment. Change to pendingCreate.status === 'Loading' || errors.
              disabled: status === 'Loading' || pendingCreate.status === 'Loading' || errors,
              tooltip: Utils.summarizeErrors(errors),
              onClick: async () => {
                try {
                  const contents = Utils.cond(
                    [isJupyterLab || isJupyter, () => JSON.stringify(notebookData[notebookKernel])],
                    [isRStudio, () => baseRmd]
                  );
                  const fullAnalysisName = `${analysisName}.${fileExt}`;
                  await createAnalysis(fullAnalysisName, toolLabel, contents);
                  await Ajax().Metrics.captureEvent(Events.analysisCreate, {
                    tool: toolLabel,
                    filename: fullAnalysisName,
                    cloudProvider,
                  });
                  setAnalysisName('');
                  enterNextViewMode(toolLabel);
                } catch (error) {
                  await reportError('Error creating analysis', error);
                  onError();
                }
              },
            },
            ['Create Analysis']
          ),
        ]),
        // TODO: Once Analyses.js is converted to implement useAnalysisFiles and refresh is called within create,
        // change next line to pendingCreate.status === 'Loading' && spinnerOverlay
        // Currently this will be close enough to the desired functionality.
        (status === 'Loading' || pendingCreate.status === 'Loading') && spinnerOverlay,
      ]);
    };

    const width = Utils.switchCase(
      viewMode,
      [environmentMode, () => 675],
      [analysisMode, () => 450],
      [Utils.DEFAULT, () => 450]
    );

    const modalBody = h(Fragment, [
      h(TitleBar, {
        id: titleId,
        title: 'Select an application',
        titleStyles: { margin: '1.5rem 0 0 1.5rem', display: viewMode ? 'none' : undefined },
        style: { width },
        titleChildren: [],
        onDismiss,
        onPrevious: viewMode ? () => resetView() : () => {},
      }),
      viewMode !== undefined && hr({ style: { borderTop: '1px solid', width: '100%', color: colors.accent() } }),
      getView(),
    ]);

    const modalProps = {
      isOpen,
      width,
      'aria-labelledby': titleId,
      onDismiss,
      onExited: resetView,
    };

    return h(ModalDrawer, { ...modalProps, children: modalBody });
  }
);
