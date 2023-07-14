import { Ajax } from 'src/libs/ajax';
import * as Utils from 'src/libs/utils';

const MethodSource = Object.freeze({
  GitHub: 'GitHub',
  Dockstore: 'Dockstore',
});

const Covid19Methods = ['fetch_sra_to_bam', 'assemble_refbased', 'sarscov2_nextstrain'];
export const isCovid19Method = (methodName) => Covid19Methods.includes(methodName);

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
