import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h, h2, img, p, span } from 'react-hyperscript-helpers';
import { isRuntimeToolLabel, runtimeToolLabels } from 'src/analysis/utils/tool-utils';
import Collapse from 'src/components/Collapse';
import { ButtonPrimary, ButtonSecondary, Clickable, IdContainer, Link, RadioButton, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon, wdlIcon } from 'src/components/icons';
import NewWorkspaceModal from 'src/components/NewWorkspaceModal';
import TopBar from 'src/components/TopBar';
import { useWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils';
import jupyterLogo from 'src/images/jupyter-logo.svg';
import scienceBackground from 'src/images/science-background.jpg';
import { Ajax } from 'src/libs/ajax';
import { fetchOk } from 'src/libs/ajax/ajax-common';
import { AnalysisProvider } from 'src/libs/ajax/analysis-providers/AnalysisProvider';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { FormLabel } from 'src/libs/forms';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useOnMount } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { isGoogleWorkspace } from 'src/libs/workspace-utils';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    flex: 'auto',
    position: 'relative',
    padding: '2rem',
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: colors.dark(),
    margin: '0 0 1rem 0',
  },
  card: {
    borderRadius: 5,
    backgroundColor: 'white',
    padding: '2rem',
    flex: 1,
    minWidth: 0,
    boxShadow: Style.standardShadow,
  },
};

const ChoiceButton = ({ iconName, title, detail, style, onClick, disabled, ...props }) => {
  const color = disabled ? colors.dark(0.25) : colors.accent(1);
  return h(
    Clickable,
    {
      style: {
        ...style,
        padding: '1rem',
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        border: `1px solid ${color}`,
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
      },
      hover: disabled ? undefined : { backgroundColor: colors.accent(0.1) },
      onClick: !disabled && onClick,
      ...props,
    },
    [
      icon(iconName, { size: 29, style: { flex: 'none', marginRight: '1rem', color } }),
      div({ style: { flex: 1 } }, [
        div({ style: { fontWeight: 'bold', color } }, [title]),
        div({ style: disabled ? { color: colors.dark(0.25) } : undefined }, [detail]),
      ]),
      icon('angle-right', { size: 32, style: { flex: 'none', marginLeft: '1rem', color } }),
    ]
  );
};

export const ImportOverview = ({ header, url, requireProtectedWorkspace, referrer }) =>
  div({ style: styles.card }, [
    h2({ style: styles.title }, [header]),
    url && div({ style: { fontSize: 16 } }, ['From: ', referrer !== undefined && referrer ? referrer : new URL(url).hostname]),
    div(
      { style: { marginTop: '1rem' } },
      requireProtectedWorkspace
        ? [
            icon('warning-standard', { size: 15, style: { marginRight: '0.25rem' }, color: colors.warning() }),
            ' The analysis you chose to import to Terra is identified as protected and requires additional security settings. Please select a workspace that has an Authorization Domain and/or protected data setting.',
            h(
              Link,
              {
                style: { marginLeft: '1rem', verticalAlign: 'middle' },
                href: 'https://support.terra.bio/hc/en-us/articles/360026775691-Overview-Managing-access-to-controlled-data-with-Authorization-Domains',
                ...Utils.newTabLinkProps,
              },
              ['Learn more about protected data', icon('pop-out', { size: 12 })]
            ),
          ]
        : 'The analysis you just chose to import to Terra will be made available to you ' +
            'within a workspace of your choice where you can then open it.'
    ),
  ]);

// ImportDestination handles selecting which workspace to import to
export const ImportDestination = ({
  workspaceId,
  templateWorkspaces,
  template,
  userHasBillingProjects,
  importMayTakeTime,
  authorizationDomain,
  onImport,
  isImporting,
  requireProtectedWorkspace,
}) => {
  const { workspaces, refresh: refreshWorkspaces, loading: loadingWorkspaces } = useWorkspaces();
  const [mode, setMode] = useState(workspaceId ? 'existing' : undefined);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [selectedTemplateWorkspaceKey, setSelectedTemplateWorkspaceKey] = useState();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId);

  const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces);

  const filteredTemplates = _.flow(
    _.flatMap((id) => (templateWorkspaces && templateWorkspaces[id]) || []),
    _.filter(({ name, namespace }) => _.some({ workspace: { namespace, name } }, workspaces))
  )(_.castArray(template));

  const importMayTakeTimeMessage = 'Note that the import process may take some time after you are redirected into your destination workspace.';

  const linkAccountPrompt = () => {
    return div({}, [
      div({ style: { marginTop: '1.5rem' } }, ['But first, to use Terra, you need to link Terra to a cloud account for compute and storage costs']),
      h(ButtonPrimary, { style: { marginTop: '.5rem', padding: '.75rem 3.5rem' }, href: '/billing' }, 'Get Started'),
    ]);
  };

  const renderSelectExistingWorkspace = () =>
    h(Fragment, [
      h2({ style: styles.title }, ['Start with an existing workspace']),
      requireProtectedWorkspace &&
        div({ style: { marginTop: '0.5rem', lineHeight: '1.5' } }, [
          icon('info-circle', { size: 15, style: { marginRight: '0.25rem' }, color: colors.accent() }),
          ' You may only import to workspaces with an Authorization Domain and/or protected data setting.',
        ]),
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            h(FormLabel, { htmlFor: id, style: { marginBottom: '0.25rem' } }, ['Select one of your workspaces']),
            h(WorkspaceSelector, {
              id,
              workspaces: _.filter((ws) => {
                return (
                  Utils.canWrite(ws.accessLevel) &&
                  (!authorizationDomain || _.some({ membersGroupName: authorizationDomain }, ws.workspace.authorizationDomain))
                );
              }, workspaces),
              value: selectedWorkspaceId,
              onChange: setSelectedWorkspaceId,
              isOptionDisabled: (workspace) => requireProtectedWorkspace && !isProtectedWorkspace(workspace),
            }),
          ]),
      ]),
      importMayTakeTime && div({ style: { marginTop: '0.5rem', lineHeight: '1.5' } }, [importMayTakeTimeMessage]),
      div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
        h(ButtonSecondary, { onClick: setMode, style: { marginLeft: 'auto' } }, ['Back']),
        h(
          ButtonPrimary,
          {
            style: { marginLeft: '2rem' },
            disabled: !selectedWorkspace,
            onClick: () => onImport(selectedWorkspace.workspace),
          },
          ['Import']
        ),
      ]),
    ]);

  const renderSelectTemplateWorkspace = () =>
    h(Fragment, [
      h2({ style: styles.title }, ['Start with a template']),
      importMayTakeTime && div({ style: { marginBottom: '1rem', lineHeight: '1.5' } }, [importMayTakeTimeMessage]),
      div(
        {
          role: 'radiogroup',
          'aria-label': 'choose a template',
          style: { overflow: 'auto', maxHeight: '25rem' },
        },
        [
          _.map(([i, ws]) => {
            const { name, namespace, description, hasNotebooks, hasWorkflows } = ws;
            const isSelected = _.isEqual({ name, namespace }, selectedTemplateWorkspaceKey);

            return div(
              {
                key: `${name}/${namespace}`,
                style: {
                  display: 'flex',
                  alignItems: 'baseline',
                  marginBottom: '1rem',
                  paddingLeft: '0.25rem',
                  ...(i > 0 ? { borderTop: Style.standardLine, paddingTop: '1rem' } : {}),
                },
              },
              [
                h(RadioButton, {
                  name: 'select-template',
                  checked: isSelected,
                  onChange: () => setSelectedTemplateWorkspaceKey({ namespace, name }),
                  text: h(
                    Collapse,
                    {
                      style: { fontSize: 14, marginLeft: '0.5rem' },
                      title: span({ style: { display: 'flex', alignItems: 'center' } }, [
                        span({ style: { fontWeight: 600 } }, [name]),
                        hasNotebooks && img({ src: jupyterLogo, style: { height: 23, width: 23, marginLeft: '0.5rem' } }),
                        hasWorkflows &&
                          wdlIcon({ style: { height: 23, width: 23, marginLeft: '0.5rem', borderRadius: 3, padding: '8px 4px 7px 4px' } }),
                      ]),
                    },
                    [p({ style: { fontSize: 14, lineHeight: '1.5', marginRight: '1rem' } }, [description])]
                  ),
                }),
              ]
            );
          }, Utils.toIndexPairs(filteredTemplates)),
        ]
      ),
      div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
        h(ButtonSecondary, { style: { marginLeft: 'auto' }, onClick: setMode }, ['Back']),
        h(
          ButtonPrimary,
          {
            style: { marginLeft: '2rem' },
            disabled: !selectedTemplateWorkspaceKey,
            onClick: () => setIsCloneOpen(true),
          },
          ['Import']
        ),
      ]),
    ]);

  return div({ style: { ...styles.card, marginLeft: '2rem' } }, [
    Utils.switchCase(
      mode,
      ['existing', () => renderSelectExistingWorkspace()],
      ['template', () => renderSelectTemplateWorkspace()],
      [
        Utils.DEFAULT,
        () => {
          return h(Fragment, [
            h2({ style: styles.title }, ['Destination of the prepared data']),
            div({ style: { marginTop: '0.5rem' } }, ['Choose the option below that best suits your needs.']),
            !userHasBillingProjects && h(linkAccountPrompt),
            !!filteredTemplates.length &&
              h(ChoiceButton, {
                onClick: () => setMode('template'),
                iconName: 'copySolid',
                title: 'Start with a template',
                detail: 'Clone from one of our template workspaces that has analyses ready for use',
              }),
            h(ChoiceButton, {
              onClick: () => setMode('existing'),
              iconName: 'fileSearchSolid',
              title: 'Start with an existing workspace',
              detail: 'Select one of your workspaces',
              disabled: !userHasBillingProjects,
            }),
            h(ChoiceButton, {
              onClick: () => setIsCreateOpen(true),
              iconName: 'plus-circle',
              title: 'Start with a new workspace',
              detail: 'Set up an empty workspace that you will configure for analysis',
              'aria-haspopup': 'dialog',
              disabled: !userHasBillingProjects,
            }),
            isCreateOpen &&
              h(NewWorkspaceModal, {
                requiredAuthDomain: authorizationDomain,
                customMessage: importMayTakeTime && importMayTakeTimeMessage,
                requireEnhancedBucketLogging: requireProtectedWorkspace,
                onDismiss: () => setIsCreateOpen(false),
                onSuccess: (w) => {
                  setMode('existing');
                  setIsCreateOpen(false);
                  setSelectedWorkspaceId(w.workspaceId);
                  refreshWorkspaces();
                  onImport(w);
                },
              }),
          ]);
        },
      ]
    ),
    isCloneOpen &&
      h(NewWorkspaceModal, {
        cloneWorkspace: _.find({ workspace: selectedTemplateWorkspaceKey }, workspaces),
        title: `Clone ${selectedTemplateWorkspaceKey.name} and Import Data`,
        buttonText: 'Clone and Import',
        customMessage: importMayTakeTime && importMayTakeTimeMessage,
        onDismiss: () => setIsCloneOpen(false),
        onSuccess: (w) => {
          setMode('existing');
          setIsCloneOpen(false);
          setSelectedWorkspaceId(w.workspaceId);
          refreshWorkspaces();
          onImport(w);
        },
      }),
    (isImporting || loadingWorkspaces) && spinnerOverlay,
  ]);
};

// This method identifies whether a workspace qualifies as protected.
// 'Protected' here means that it has enhanced logging - either on its own or because it has an auth domain.
// For now this also means only GCP workspaces are included.
export const isProtectedWorkspace = (workspace) => {
  if (!isGoogleWorkspace(workspace)) {
    return false;
  }
  return !!workspace.workspace.bucketName && workspace.workspace.bucketName.startsWith('fc-secure');
};

// This method fetches the raw file from the URL, then writes it to the
// workspace bucket, notebooks folder.
export const importAnalysisFile = (namespace, name, url, filename, runtime) => {
  return async () => {
    if (!isRuntimeToolLabel(runtime)) {
      throw new Error(`${runtime} is not a valid analysis runtime: ${Object.values(runtimeToolLabels)}`);
    }
    const workspaceDetails = await Ajax().Workspaces.workspace(namespace, name).details(['workspace']);
    const fetchFileResponse = await fetchOk(url);
    const fileContents = await fetchFileResponse.text();
    await AnalysisProvider.createAnalysis(workspaceDetails.workspace, filename, runtime, fileContents);
    notify('success', 'Analysis file imported successfully.', { timeout: 3000 });
  };
};

// ImportAnalysis handles all the information relating to the page itself - this includes:
// * Reading from the URL
// * Loading the analysis file
// * Managing the import
const ImportAnalysis = () => {
  const {
    query: { url, ad, wid, template, referrer, requireProtected, filename, runtime },
  } = Nav.useRoute();
  const [templateWorkspaces, setTemplateWorkspaces] = useState();
  const [userHasBillingProjects, setUserHasBillingProjects] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const [title, header] = ['Import Analysis', `Analysis (${runtime})`];

  const requireProtectedWorkspace = requireProtected !== undefined && requireProtected;

  useOnMount(() => {
    const loadTemplateWorkspaces = _.flow(
      Utils.withBusyState(setIsImporting),
      withErrorReporting('Error loading initial data')
    )(async () => {
      const templates = await Ajax().FirecloudBucket.getTemplateWorkspaces();
      setTemplateWorkspaces(templates);
      const projects = await Ajax().Billing.listProjects();
      setUserHasBillingProjects(projects.length > 0);
    });
    loadTemplateWorkspaces();
  });

  const onImport = _.flow(
    Utils.withBusyState(setIsImporting),
    withErrorReporting('Import Error')
  )(async (workspace) => {
    const { namespace, name } = workspace;
    await importAnalysisFile(namespace, name, url, filename, runtime)();
    await Ajax().Metrics.captureEvent(Events.analysisImport, {
      referrer,
      filename,
      runtime,
      ...extractWorkspaceDetails(workspace),
    });
    Nav.goToPath('workspace-analyses', { namespace, name });
  });

  return h(FooterWrapper, [
    h(TopBar, { title }),
    div({ role: 'main', style: styles.container }, [
      img({
        src: scienceBackground,
        alt: '',
        style: { position: 'fixed', top: 0, left: 0, zIndex: -1 },
      }),
      h(ImportOverview, { header, url, requireProtectedWorkspace, referrer }),
      h(ImportDestination, {
        workspaceId: wid,
        templateWorkspaces,
        template,
        userHasBillingProjects,
        importMayTakeTime: false,
        authorizationDomain: ad,
        onImport,
        isImporting,
        requireProtectedWorkspace,
      }),
    ]),
  ]);
};

export const navPaths = [
  {
    name: 'import-analysis',
    path: '/import-analysis',
    component: ImportAnalysis,
    title: 'Import Analysis',
  },
];
