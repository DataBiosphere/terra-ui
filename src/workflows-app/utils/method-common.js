import { Ajax } from 'src/libs/ajax';
import { notify } from 'src/libs/notifications';
import { workflowsAppStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { doesAppProxyUrlExist } from 'src/workflows-app/utils/app-utils';
import { CbasPollInterval } from 'src/workflows-app/utils/submission-utils';

const MethodSource = Object.freeze({
  GitHub: 'GitHub',
  Dockstore: 'Dockstore',
});

const Covid19Methods = ['fetch_sra_to_bam', 'assemble_refbased', 'sarscov2_nextstrain'];
export const isCovid19Method = (methodName) => Covid19Methods.includes(methodName);

export const submitMethod = async (signal, method, workspace, onSuccess, onError) => {
  if (doesAppProxyUrlExist(workspace.workspace.workspaceId, 'cbasProxyUrlState')) {
    try {
      const methodPayload = {
        method_name: method.method_name,
        method_description: method.method_description,
        method_source: method.method_source,
        method_version: method.method_version,
        method_url: method.method_url,
      };
      const methodObject = await Ajax(signal).Cbas.methods.post(workflowsAppStore.get().cbasProxyUrlState.state, methodPayload);

      onSuccess(methodObject);
    } catch (error) {
      onError(error);
    }
  } else {
    const cbasUrlState = workflowsAppStore.get().cbasProxyUrlState.state;
    const errorDetails = cbasUrlState instanceof Response ? await cbasUrlState.text() : cbasUrlState;
    const additionalDetails = errorDetails ? `Error details: ${JSON.stringify(errorDetails)}` : '';
    notify('warn', 'Error loading Workflows app', {
      detail: `Workflows app not found. Please check if Workflows app is running. ${additionalDetails}`,
      timeout: CbasPollInterval - 1000,
    });
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
