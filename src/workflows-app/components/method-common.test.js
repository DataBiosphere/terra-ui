import { Ajax } from 'src/libs/ajax';
import { convertToRawUrl, getMethodVersionName } from 'src/workflows-app/components/method-common';

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

jest.mock('src/libs/ajax');

describe('convertToRawUrl', () => {
  const nonDockstoreValidTestCases = [
    // "GitHub" as source
    {
      methodPath: 'https://raw.githubusercontent.com/broadinstitute/cromwell/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl',
      methodVersion: 'develop',
      methodSource: 'GitHub',
      expectedRawUrl: 'https://raw.githubusercontent.com/broadinstitute/cromwell/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl',
    },
    {
      methodPath: 'https://github.com/broadinstitute/cromwell/blob/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl',
      methodVersion: 'develop',
      methodSource: 'GitHub',
      expectedRawUrl: 'https://raw.githubusercontent.com/broadinstitute/cromwell/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl',
    },
    // "Github" as source
    {
      methodPath: 'https://raw.githubusercontent.com/broadinstitute/cromwell/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl',
      methodVersion: 'develop',
      methodSource: 'Github',
      expectedRawUrl: 'https://raw.githubusercontent.com/broadinstitute/cromwell/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl',
    },
    {
      methodPath: 'https://github.com/broadinstitute/cromwell/blob/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl',
      methodVersion: 'develop',
      methodSource: 'Github',
      expectedRawUrl: 'https://raw.githubusercontent.com/broadinstitute/cromwell/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl',
    },
  ];

  test.each(nonDockstoreValidTestCases)('returns raw URL for GitHub source', ({ methodPath, methodVersion, methodSource, expectedRawUrl }) => {
    expect(convertToRawUrl(methodPath, methodVersion, methodSource)).toBe(expectedRawUrl);
  });

  it('should call Dockstore to retrive raw URL', async () => {
    const methodPath = 'github.com/broadinstitute/viral-pipelines/fetch_sra_to_bam';
    const methodVersion = 'master';
    const methodSource = 'Dockstore';
    const rawUrl = 'https://raw.githubusercontent.com/broadinstitute/viral-pipelines/master/pipes/WDL/workflows/fetch_sra_to_bam.wdl';

    const mockDockstoreWfSourceMethod = jest.fn(() => Promise.resolve(rawUrl));

    Ajax.mockImplementation(() => {
      return {
        Dockstore: {
          getWorkflowSourceUrl: mockDockstoreWfSourceMethod,
        },
      };
    });

    const actualUrl = await convertToRawUrl(methodPath, methodVersion, methodSource);

    expect(mockDockstoreWfSourceMethod).toBeCalledTimes(1);
    expect(mockDockstoreWfSourceMethod).toHaveBeenCalledWith(methodPath, methodVersion);
    expect(actualUrl).toBe(rawUrl);
  });

  it('should throw error for unknown method source', () => {
    const methodPath = 'https://my-website/hello-world.wdl';
    const methodVersion = 'develop';
    const methodSource = 'MySource';

    try {
      convertToRawUrl(methodPath, methodVersion, methodSource);
    } catch (e) {
      expect(e.message).toBe("Unknown method source 'MySource'. Currently supported method sources are [GitHub, Dockstore].");
    }
  });
});

describe('getMethodVersionName in ImportGithub component', () => {
  // testing various methods living at different depths of directory trees to ensure accuracy of getMethodVersionName()
  const testUrls = [
    {
      url: 'https://raw.githubusercontent.com/broadinstitute/cromwell/develop/wdl/transforms/draft3/src/test/cases/simple_task.wdl',
      expectedVersion: 'develop',
    },
    {
      url: 'https://github.com/broadinstitute/warp/blob/Imputation_v1.1.1/pipelines/broad/arrays/imputation/Imputation.wdl',
      expectedVersion: 'Imputation_v1.1.1',
    },
    {
      url: 'https://github.com/DataBiosphere/topmed-workflows/tree/1.32.0/aligner/functional-equivalence-wdl/FunctionalEquivalence.wdl',
      expectedVersion: '1.32.0',
    }, // from dockstore
    { url: 'https://github.com/broadinstitute/cromwell/blob/develop/wom/src/test/resources/command_parameters/test.wdl', expectedVersion: 'develop' },
    { url: 'https://raw.githubusercontent.com/broadinstitute/cromwell/develop/wom/src/test/resources/wc.wdl', expectedVersion: 'develop' },
    {
      url: 'https://raw.githubusercontent.com/broadinstitute/warp/VariantCalling_v2.1.2/pipelines/broad/dna_seq/germline/variant_calling/VariantCalling.wdl',
      expectedVersion: 'VariantCalling_v2.1.2',
    },
    {
      url: 'https://github.com/broadinstitute/warp/blob/AnnotationFiltration_v1.2.4/pipelines/broad/annotation_filtration/AnnotationFiltration.wdl',
      expectedVersion: 'AnnotationFiltration_v1.2.4',
    },
    {
      url: 'https://raw.githubusercontent.com/broadinstitute/warp/AnnotationFiltration_v1.2.4/pipelines/broad/annotation_filtration/AnnotationFiltration.wdl',
      expectedVersion: 'AnnotationFiltration_v1.2.4',
    },
    { url: 'https://github.com/broadinstitute/warp/blob/scATAC_v1.3.0/tasks/skylab/HISAT2.wdl', expectedVersion: 'scATAC_v1.3.0' },
    { url: 'https://raw.githubusercontent.com/broadinstitute/cromwell/54/wom/src/test/resources/command_parameters/test.wdl', expectedVersion: '54' },
  ];

  test.each(testUrls)('returns expected version for url', ({ url, expectedVersion }) => {
    expect(getMethodVersionName(url)).toBe(expectedVersion);
  });
});
