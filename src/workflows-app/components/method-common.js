import { Ajax } from 'src/libs/ajax';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { getUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { resolveRunningCromwellAppUrl } from 'src/libs/workflows-app-utils';

const MethodSource = Object.freeze({
  GitHub: 'GitHub',
  Dockstore: 'Dockstore',
});

export const submitMethod = async (signal, onDismiss, method, workspace) => {
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

export const convertToRawUrl = (methodPath, methodVersion, methodSource) => {
  return Utils.cond(
    // the case-insensitive check is to maintain backwards compatibility as 3 Covid-19 workflows have 'Github' as source
    [
      methodSource.toLowerCase() === MethodSource.GitHub.toLowerCase(),
      () => {
        // mapping of searchValues (key) and their replaceValue (value)
        const mapObj = {
          github: 'raw.githubusercontent',
          'blob/': '',
        };
        return methodPath.replace(/\b(?:github|blob\/)\b/gi, (matched) => mapObj[matched]);
      },
    ],
    [
      methodSource.toLowerCase() === MethodSource.Dockstore.toLowerCase(),
      async () => await Ajax().Dockstore.getWorkflowSourceUrl(methodPath, methodVersion),
    ],
    () => {
      throw new Error(
        `Unknown method source '${methodSource}'. Currently supported method sources are [${MethodSource.GitHub}, ${MethodSource.Dockstore}].`
      );
    }
  );
};

export const getMethodVersionName = (url) => {
  let segmentedUrlPath;
  // handle raw urls
  if (url.includes('https://raw.githubusercontent.com')) {
    segmentedUrlPath = url.split('/', 6).slice(-1)[0];
  } else {
    segmentedUrlPath = url.split('/', 7).slice(-1)[0];
  }
  return segmentedUrlPath;
};
