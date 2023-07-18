import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary } from 'src/components/common';
import { icon } from 'src/components/icons';
import { ValidatedInput } from 'src/components/input';
import { TooltipCell } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import colors from 'src/libs/colors';
import { FormLabel } from 'src/libs/forms';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { getUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { withBusyState } from 'src/libs/utils';
import { resolveRunningCromwellAppUrl } from 'src/libs/workflows-app-utils';
import { getMethodVersionName } from 'src/workflows-app/utils/method-common';
import validate from 'validate.js';

const constraints = {
  methodUrl: {
    length: { maximum: 254 },
    url: true,
  },
  methodName: {
    presence: { allowEmpty: false },
  },
};

const submitMethod = async (signal, onDismiss, method, workspace) => {
  const namespace = await workspace.workspace.namespace;
  try {
    const cbasUrl = (
      await Apps(signal)
        .listAppsV2(workspace.workspace.workspaceId)
        .then((apps) => resolveRunningCromwellAppUrl(apps, getUser()?.email))
    ).cbasUrl;

    if (cbasUrl) {
      const methodPayload = {
        method_name: method.method_name,
        method_description: method.method_description,
        method_source: method.method_source,
        method_version: method.method_version,
        method_url: method.method_url,
      };
      const methodObject = await Ajax(signal).Cbas.methods.post(cbasUrl, methodPayload);
      onDismiss();
      Nav.goToPath('workspace-workflows-app-submission-config', {
        name: workspace.workspace.name,
        namespace,
        methodId: methodObject.method_id,
      });
    }
  } catch (error) {
    notify('error', 'Error creating new method', { detail: error instanceof Response ? await error.text() : error });
    onDismiss();
  }
};

const ImportGithub = ({ setLoading, signal, onDismiss, workspace }) => {
  const [methodName, setMethodName] = useState('');
  const [methodVersionName, setMethodVersionName] = useState('');
  const [methodUrl, setMethodUrl] = useState('');
  const [methodUrlModified, setMethodUrlModified] = useState(false);
  const [methodNameModified, setMethodNameModified] = useState(false);

  const errors = validate({ methodName, methodUrl }, constraints, {
    prettify: (v) => ({ methodName: 'Method name', methodUrl: 'Workflow url' }[v] || validate.prettify(v)),
  });

  const updateWorkflowName = (url) => {
    setMethodName(url.substring(url.lastIndexOf('/') + 1).replace('.wdl', ''));
  };
  return div({ style: { marginLeft: '4rem', width: '50%' } }, [
    div({ style: { fontSize: 30, display: 'flex', alignItems: 'center' } }, [
      h(FormLabel, { htmlFor: 'methodurl', required: true }, ['Workflow Link']),
      h(TooltipCell, { tooltip: 'Link must start with https://github.com or https://raw.githubusercontent.com' }, [
        icon('error-standard', { size: 20, style: { top: '50px', marginLeft: '1rem', color: colors.accent(), cursor: 'help' } }),
      ]),
    ]),
    h(ValidatedInput, {
      inputProps: {
        id: 'methodurl',
        placeholder: 'Paste Github link',
        value: methodUrl,
        onChange: (u) => {
          updateWorkflowName(u);
          setMethodVersionName(getMethodVersionName(u));
          setMethodUrl(u);
          setMethodUrlModified(true);
        },
      },
      error: Utils.summarizeErrors(methodUrlModified && errors?.methodUrl),
    }),
    h(FormLabel, { htmlFor: 'workflowName', required: true }, ['Workflow Name']),
    h(ValidatedInput, {
      inputProps: {
        id: 'workflowName',
        placeholder: 'Workflow Name',
        value: methodName,
        onChange: (n) => {
          setMethodName(n);
          setMethodNameModified(true);
        },
      },
      error: Utils.summarizeErrors(methodNameModified && errors?.methodName),
    }),
    div({}, [
      h(
        ButtonPrimary,
        {
          style: { marginTop: '2rem' },
          'aria-label': 'Add to Workspace button',
          disabled: errors,
          onClick: () => {
            const method = {
              method_name: methodName,
              method_version: methodVersionName,
              method_url: methodUrl,
              method_source: 'GitHub',
            };
            withBusyState(setLoading, submitMethod(signal, onDismiss, method, workspace));
          },
        },
        ['Add to Workspace']
      ),
    ]),
  ]);
};

export default ImportGithub;
