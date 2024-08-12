import { DeepPartial } from '@terra-ui-packages/core-utils';
import { delay } from '@terra-ui-packages/core-utils';
import { act, fireEvent, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { snapshotStore } from 'src/libs/state';
import { BaseWorkflowConfigs } from 'src/pages/workflows/workflow/WorkflowConfigs';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

type AjaxContract = ReturnType<typeof Ajax>;

jest.mock('src/libs/ajax');

jest.mock('src/libs/notifications');

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    getLink: jest.fn(),
    goToPath: jest.fn(),
  })
);

jest.mock('react-virtualized', () => {
  const actual = jest.requireActual('react-virtualized');

  const { AutoSizer } = actual;

  class MockAutoSizer extends AutoSizer {
    state = {
      height: 1000,
      width: 1000,
    };

    setState = () => {};
  }

  return {
    ...actual,
    AutoSizer: MockAutoSizer,
  };
});

describe('WorkflowConfigs Component', () => {
  const mockConfigurations = [
    {
      name: 'cnv_somatic_pair_workflow',
      createDate: '2017-10-20T20:27:46Z',
      url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/configurations/anichols/cnv_somatic_pair_workflow/2',
      entityType: 'Configuration',
      payloadObject: {
        deleted: false,
        inputs: {},
        methodConfigVersion: 1,
        methodRepoMethod: {
          methodName: 'cnv_somatic_pair_workflow',
          methodNamespace: 'nameFoo',
          methodVersion: 1,
        },
        name: 'cnv_somatic_pair_workflow',
        namespace: 'nameFoo',
        outputs: {},
        prerequisites: {},
        rootEntityType: 'participant',
      },
      snapshotId: 2,
      namespace: 'nameFoo',
    },
    {
      name: 'cnv_somatic_pair_workflow',
      createDate: '2017-10-20T20:27:54Z',
      url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/configurations/anichols/cnv_somatic_pair_workflow/3',
      entityType: 'Configuration',
      payloadObject: {
        deleted: false,
        inputs: {},
        methodConfigVersion: 1,
        methodRepoMethod: {
          methodName: 'cnv_somatic_pair_workflow',
          methodNamespace: 'nameFoo',
          methodVersion: 1,
        },
        name: 'cnv_somatic_pair_workflow',
        namespace: 'nameFoo',
        outputs: {},
        prerequisites: {},
        rootEntityType: 'participant',
      },
      snapshotId: 3,
      namespace: 'nameFoo',
    },
  ];

  const mockGet = {
    managers: ['mana.ger@gmail.com'],
    name: 'cnv_somatic_pair_workflow',
    createDate: '2017-10-20T20:07:22Z',
    documentation: '',
    entityType: 'Workflow',
    snapshotComment: '',
    snapshotId: 1,
    namespace: 'nameFoo',
    payload:
      '# Workflow for running GATK CNV (and optionally, ACNV) on tumor/normal or tumor-only cases. Supports both WGS and WES.\n#\n# Notes:\n#\n# - The target file (targets) is required for the WES workflow and should be a TSV file with the column headers:\n#    contig    start    stop    name\n#   These targets will be padded on both sides by the amount specified by PadTargets.padding (default 250).\n#\n# - If a target file is not provided, then the WGS workflow will be run instead and the specified value of\n#   wgs_bin_size (default 10000) will be used.\n#\n# - A normal BAM (normal_bam) is requrired for the tumor/normal workflow.  If not provided, the tumor-only workflow\n#   will be run.\n#\n# - The sites file (common_sites) is required for the ACNV workflow and should be a Picard interval list.\n#   If not provided, the ACNV workflow will not be run.\n#\n# - Example invocation:\n#    java -jar cromwell.jar run cnv_somatic_pair_workflow.wdl myParameters.json\n#   See cnv_somatic_pair_workflow_template.json for a template json file to modify with your own parameters (please save\n#   your modified version with a different filename and do not commit to the gatk repository).\n#\n#############\n\nimport "https://firecloud-orchestration.dsde-dev.broadinstitute.org/ga4gh/v1/tools/anichols:cnv_common_tasks/versions/4/plain-WDL/descriptor" as CNVTasks\nimport "https://firecloud-orchestration.dsde-dev.broadinstitute.org/ga4gh/v1/tools/anichols:cnv_somatic_copy_ratio_bam_workflow/versions/2/plain-WDL/descriptor" as CopyRatio\nimport "https://firecloud-orchestration.dsde-dev.broadinstitute.org/ga4gh/v1/tools/anichols:cnv_somatic_allele_fraction_pair_workflow/versions/1/plain-WDL/descriptor" as AlleleFraction\nimport "https://firecloud-orchestration.dsde-dev.broadinstitute.org/ga4gh/v1/tools/anichols:cnv_somatic_oncotate/versions/2/plain-WDL/descriptor" as Oncotate\n\nworkflow CNVSomaticPairWorkflow {\n    # Workflow input files\n    File? targets\n    File? common_sites\n    File tumor_bam\n    File tumor_bam_idx\n    File? normal_bam\n    File? normal_bam_idx\n    File ref_fasta\n    File ref_fasta_dict\n    File ref_fasta_fai\n    File cnv_panel_of_normals\n    String gatk_jar\n\n    # If no target file is input, then do WGS workflow\n    Boolean is_wgs = select_first([targets, ""]) == ""\n    # If no sites file is input, then do not do ACNV workflow\n    Boolean is_cnv_only = select_first([common_sites, ""]) == ""\n    # If no normal BAM is input, then do tumor-only workflow\n    Boolean is_tumor_only = select_first([normal_bam, ""]) == ""\n\n    Boolean is_run_oncotator = false\n\n    # docker images\n    String gatk_docker\n    String oncotator_docker="broadinstitute/oncotator:1.9.3.0-eval-gatk-protected"\n\n    if (!is_wgs) {\n        call CNVTasks.PadTargets {\n            input:\n                # The task will fail if targets is not defined when it gets here, but that should not be allowed to happen.\n                targets = select_first([targets, ""]),\n                gatk_jar = gatk_jar,\n                gatk_docker = gatk_docker\n        }\n    }\n\n    call CopyRatio.CNVSomaticCopyRatioBAMWorkflow as TumorCopyRatioWorkflow {\n        input:\n            padded_targets = PadTargets.padded_targets,\n            bam = tumor_bam,\n            bam_idx = tumor_bam_idx,\n            ref_fasta = ref_fasta,\n            ref_fasta_dict = ref_fasta_dict,\n            ref_fasta_fai = ref_fasta_fai,\n            cnv_panel_of_normals = cnv_panel_of_normals,\n            gatk_jar = gatk_jar,\n            gatk_docker = gatk_docker\n    }\n\n    if (!is_tumor_only) {\n        call CopyRatio.CNVSomaticCopyRatioBAMWorkflow as NormalCopyRatioWorkflow {\n            input:\n                padded_targets = PadTargets.padded_targets,\n                bam = select_first([normal_bam, ""]),\n                bam_idx = select_first([normal_bam_idx, ""]),\n                ref_fasta = ref_fasta,\n                ref_fasta_dict = ref_fasta_dict,\n                ref_fasta_fai = ref_fasta_fai,\n                cnv_panel_of_normals = cnv_panel_of_normals,\n                gatk_jar = gatk_jar,\n                gatk_docker = gatk_docker\n        }\n    }\n\n    if (!is_cnv_only) {\n        call AlleleFraction.CNVSomaticAlleleFractionPairWorkflow as TumorAlleleFractionWorkflow {\n            input:\n                common_sites = select_first([common_sites, ""]),\n                tumor_bam = tumor_bam,\n                tumor_bam_idx = tumor_bam_idx,\n                normal_bam = normal_bam,    # If no normal BAM is input, tumor-only GetBayesianHetCoverage will be run\n                normal_bam_idx = normal_bam_idx,\n                tumor_tn_coverage = TumorCopyRatioWorkflow.tn_coverage,\n                tumor_called_segments = TumorCopyRatioWorkflow.called_segments,\n                ref_fasta = ref_fasta,\n                ref_fasta_dict = ref_fasta_dict,\n                ref_fasta_fai = ref_fasta_fai,\n                gatk_jar = gatk_jar,\n                gatk_docker = gatk_docker,\n                is_wgs = is_wgs\n        }\n    }\n\n    if (is_run_oncotator) {\n        call Oncotate.CNVOncotateCalledSegments as OncotateCalledCNVWorkflow {\n            input:\n                 called_file=TumorCopyRatioWorkflow.called_segments,\n                 oncotator_docker=oncotator_docker\n        }\n    }\n\n    output {\n        String tumor_entity_id = TumorCopyRatioWorkflow.entity_id\n        File tumor_tn_coverage = TumorCopyRatioWorkflow.tn_coverage\n        File tumor_called_segments = TumorCopyRatioWorkflow.called_segments\n        String? normal_entity_id = NormalCopyRatioWorkflow.entity_id\n        File? normal_tn_coverage = NormalCopyRatioWorkflow.tn_coverage\n        File? normal_called_segments = NormalCopyRatioWorkflow.called_segments\n        File? tumor_hets = TumorAlleleFractionWorkflow.tumor_hets\n        File? tumor_acnv_segments = TumorAlleleFractionWorkflow.acnv_segments\n        File? oncotated_called_file = OncotateCalledCNVWorkflow.oncotated_called_file\n    }\n}',
    url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/methods/anichols/cnv_somatic_pair_workflow/1',
    public: true,
    synopsis: 'synop',
  };

  const mockMethodList = [
    {
      name: 'cnv_somatic_pair_workflow',
      createDate: '2017-10-20T20:07:22Z',
      url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/methods/anichols/cnv_somatic_pair_workflow/1',
      synopsis: 'For a wonderful test',
      entityType: 'Workflow',
      snapshotComment: '',
      snapshotId: 1,
      namespace: 'nameFoo',
    },
  ];

  beforeEach(() => {
    jest.spyOn(snapshotStore, 'get').mockImplementation(
      jest.fn().mockReturnValue({
        namespace: 'nameFoo',
        name: 'cnv_somatic_pair_workflow',
        snapshotId: 1,
      })
    );

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Methods: {
            list: jest.fn(() => Promise.resolve(mockMethodList)),
            definitions: jest.fn(),
            configInputsOutputs: jest.fn(),
            template: jest.fn(),
            method: () => ({
              allConfigs: jest.fn(() => Promise.resolve(mockConfigurations)),
              get: jest.fn(() => Promise.resolve(mockGet)),
              configs: jest.fn(() => Promise.resolve([])),
              toWorkspace: jest.fn(),
            }),
          } as DeepPartial<AjaxContract['Methods']>,
        } as Partial<AjaxContract> as AjaxContract)
    );
  });

  it('Renders configurations as expected', async () => {
    // ** ACT **
    await act(async () => render(h(BaseWorkflowConfigs, { searchFilter: '' })));

    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Workflow Snapshot')).toBeInTheDocument();
  });

  it('filters configurations', async () => {
    // ** ACT **
    // Render configurations without a filter
    const { rerender } = await act(async () => render(h(BaseWorkflowConfigs, { searchFilter: '' })));

    const tableRows: HTMLElement[] = screen.getAllByRole('row').slice(1); // skip header row

    expect(tableRows.length).toBe(2);

    // Rerender configurations with a filter
    await act(async () => {
      rerender(h(BaseWorkflowConfigs));
    });

    fireEvent.change(screen.getByPlaceholderText('Search Configurations'), { target: { value: '3' } });
    await act(() => delay(300)); // debounced search

    expect(screen.queryByText('nameFoo/cnv_somatic_pair_workflow Snapshot ID: 2')).not.toBeInTheDocument();
    expect(screen.queryByText('nameFoo/cnv_somatic_pair_workflow Snapshot ID: 3')).toBeInTheDocument();
  });
});
