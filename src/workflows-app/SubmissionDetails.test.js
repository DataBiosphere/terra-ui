import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { failedTasks as failedTasksMetadata } from 'src/workflows-app/fixtures/failed-tasks';
import { diff as callCacheDiff } from 'src/workflows-app/fixtures/test-callcache-diff';
import { metadata as runDetailsMetadata } from 'src/workflows-app/fixtures/test-workflow';
import { BaseSubmissionDetails } from 'src/workflows-app/SubmissionDetails';
import { methodData, mockRunsData, runSetData, simpleRunsData } from 'src/workflows-app/utils/mock-data';
import { mockAzureApps, mockAzureWorkspace, runSetOutputDef, runSetResponse } from 'src/workflows-app/utils/mock-responses';

const submissionId = 'e8347247-4738-4ad1-a591-56c119f93f58';
const cbasUrlRoot = 'https://lz-abc/terra-app-abc/cbas';
const cromwellUrlRoot = 'https://lz-abc/terra-app-abc/cromwell';
const wdsUrlRoot = 'https://lz-abc/wds-abc-c07807929cd1/';

const mockWorkflow = {
  workflowName: 'fetch_sra_to_bam',
  workflowProcessingEvents: [
    {
      cromwellId: 'cromid-b3a731a',
      description: 'Finished',
      timestamp: '2024-01-11T19:58:56.503Z',
      cromwellVersion: '87-225ea5a',
    },
    {
      cromwellId: 'cromid-b3a731a',
      description: 'PickedUp',
      timestamp: '2024-01-11T19:36:14.600Z',
      cromwellVersion: '87-225ea5a',
    },
  ],
  actualWorkflowLanguageVersion: '1.0',
  submittedFiles: {
    workflow:
      'version 1.0\n\nimport "../tasks/tasks_ncbi_tools.wdl" as ncbi_tools\n\nworkflow fetch_sra_to_bam {\n    meta {\n        description: "Retrieve reads from the NCBI Short Read Archive in unaligned BAM format with relevant metadata encoded."\n        author: "Broad Viral Genomics"\n        email:  "viral-ngs@broadinstitute.org"\n        allowNestedInputs: true\n    }\n\n    call ncbi_tools.Fetch_SRA_to_BAM\n\n    output {\n        File   reads_ubam                = Fetch_SRA_to_BAM.reads_ubam\n        String sequencing_center         = Fetch_SRA_to_BAM.sequencing_center\n        String sequencing_platform       = Fetch_SRA_to_BAM.sequencing_platform\n        String sequencing_platform_model = Fetch_SRA_to_BAM.sequencing_platform_model\n        String biosample_accession       = Fetch_SRA_to_BAM.biosample_accession\n        String library_id                = Fetch_SRA_to_BAM.library_id\n        String run_date                  = Fetch_SRA_to_BAM.run_date\n        String sample_collection_date    = Fetch_SRA_to_BAM.sample_collection_date\n        String sample_collected_by       = Fetch_SRA_to_BAM.sample_collected_by\n        String sample_strain             = Fetch_SRA_to_BAM.sample_strain\n        String sample_geo_loc            = Fetch_SRA_to_BAM.sample_geo_loc\n        File   sra_metadata              = Fetch_SRA_to_BAM.sra_metadata\n    }\n}\n',
    root: '',
    options:
      '{\n  "final_workflow_log_dir": "https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-a5150ece-9040-4ff2-8206-375c1e492be5/cromwell-workflow-logs",\n  "read_from_cache": true,\n  "workflow_callback_uri": "https://lz7388ada396994bb48ea5c87a02eed673689c82c2af423d03.servicebus.windows.net/terra-app-a5150ece-9040-4ff2-8206-375c1e492be5-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/cbas/api/batch/v1/runs/results",\n  "write_to_cache": true\n}',
    inputs: '{"fetch_sra_to_bam.Fetch_SRA_to_BAM.SRA_ID":"ERR4868270"}',
    workflowUrl: 'https://raw.githubusercontent.com/broadinstitute/viral-pipelines/v2.1.33.16/pipes/WDL/workflows/fetch_sra_to_bam.wdl',
    labels: '{}',
  },
  calls: {
    'fetch_sra_to_bam.Fetch_SRA_to_BAM': [
      {
        tes_stderr:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/tes_task/stderr.txt',
        tes_stdout:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/tes_task/stdout.txt',
        stdout:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/execution/stdout',
        commandLine:
          "set -e\n# fetch SRA metadata on this record\nesearch -db sra -q \"ERR4868270\" | efetch -mode json -json > SRA.json\ncp SRA.json \"ERR4868270.json\"\n\n# pull reads from SRA and make a fully annotated BAM -- must succeed\nCENTER=$(jq -r .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SUBMISSION.center_name SRA.json)\nPLATFORM=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM | keys[] as $k | \"\\($k)\"' SRA.json)\nMODEL=$(jq -r \".EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM.$PLATFORM.INSTRUMENT_MODEL\" SRA.json)\nSAMPLE=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.IDENTIFIERS.EXTERNAL_ID|select(.namespace == \"BioSample\")|.content' SRA.json)\nLIBRARY=$(jq -r .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.alias SRA.json)\nRUNDATE=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.RUN_SET.RUN.SRAFiles|if (.SRAFile|type) == \"object\" then .SRAFile.date else [.SRAFile[]|select(.supertype == \"Original\")][0].date end' SRA.json | cut -f 1 -d ' ')\n\nif [ \"$PLATFORM\" = \"OXFORD_NANOPORE\" ]; then\n    # per the SAM/BAM specification\n    SAM_PLATFORM=\"ONT\"\nelse\n    SAM_PLATFORM=\"$PLATFORM\"\nfi\n\nsam-dump --unaligned --header \"ERR4868270\" \\\n    | samtools view -bhS - \\\n    > temp.bam\npicard AddOrReplaceReadGroups \\\n    I=temp.bam \\\n    O=\"ERR4868270.bam\" \\\n    RGID=1 \\\n    RGLB=\"$LIBRARY\" \\\n    RGSM=\"$SAMPLE\" \\\n    RGPL=\"$SAM_PLATFORM\" \\\n    RGPU=\"$LIBRARY\" \\\n    RGPM=\"$MODEL\" \\\n    RGDT=\"$RUNDATE\" \\\n    RGCN=\"$CENTER\" \\\n    VALIDATION_STRINGENCY=SILENT\nrm temp.bam\nsamtools view -H \"ERR4868270.bam\"\n\n# emit numeric WDL outputs\necho $CENTER > OUT_CENTER\necho $PLATFORM > OUT_PLATFORM\necho $SAMPLE > OUT_BIOSAMPLE\necho $LIBRARY > OUT_LIBRARY\necho $RUNDATE > OUT_RUNDATE\nsamtools view -c \"ERR4868270.bam\" | tee OUT_NUM_READS\n\n# pull other metadata from SRA -- allow for silent failures here!\ntouch OUT_MODEL OUT_COLLECTION_DATE OUT_STRAIN OUT_COLLECTED_BY OUT_GEO_LOC\nset +e\njq -r \\\n    .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM.\"$PLATFORM\".INSTRUMENT_MODEL \\\n    SRA.json | tee OUT_MODEL\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"collection_date\" or .TAG==\"collection date\")|.VALUE' \\\n    SRA.json | tee OUT_COLLECTION_DATE\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"strain\")|.VALUE' \\\n    SRA.json | tee OUT_STRAIN\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"collected_by\" or .TAG == \"collecting institution\")|.VALUE' \\\n    SRA.json | tee OUT_COLLECTED_BY\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"geo_loc_name\" or .TAG == \"geographic location (country and/or sea)\")|.VALUE' \\\n    SRA.json | tee OUT_GEO_LOC\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.DESIGN.LIBRARY_DESCRIPTOR.LIBRARY_STRATEGY' \\\n    SRA.json | tee OUT_LIBRARY_STRATEGY\n\nset -e\npython3 << CODE\nimport json\nwith open('SRA.json', 'rt') as inf:\n    meta = json.load(inf)\n# reorganize to look more like a biosample attributes tsv\nbiosample = dict((x['TAG'],x['VALUE']) for x in meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['SAMPLE']['SAMPLE_ATTRIBUTES']['SAMPLE_ATTRIBUTE'])\nbiosample['accession'] = meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['SAMPLE']['IDENTIFIERS']['EXTERNAL_ID']['content']\nbiosample['message'] = 'Successfully loaded'\nbiosample['bioproject_accession'] = meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['STUDY']['IDENTIFIERS']['EXTERNAL_ID']['content']\nbiosample['sample_name'] = biosample['isolate']\nfor k,v in biosample.items():\n    if v == 'not provided':\n        biosample[k] = ''\n\n# British to American conversions (NCBI vs ENA)\nus_to_uk = {\n    'sample_name': 'Sample Name',\n    'isolate': 'Sample Name',\n    'collected_by': 'collecting institution',\n    'collection_date': 'collection date',\n    'geo_loc_name': 'geographic location (country and/or sea)',\n    'host': 'host scientific name',\n}\nfor key_us, key_uk in us_to_uk.items():\n    if not biosample.get(key_us,''):\n        biosample[key_us] = biosample.get(key_uk,'')\n\n# write outputs\nwith open('ERR4868270-biosample_attributes.json', 'wt') as outf:\n    json.dump(biosample, outf)\nCODE",
        shardIndex: -1,
        runtimeAttributes: {
          preemptible: 'true',
          disk: '750 GB',
          failOnStderr: 'false',
          disks: 'local-disk 750 LOCAL',
          continueOnReturnCode: '0',
          docker: 'quay.io/broadinstitute/ncbi-tools:2.10.7.10',
          maxRetries: '2',
          cpu: '2',
          memory: '6 GB',
        },
        callCaching: {
          allowResultReuse: false,
          effectiveCallCachingMode: 'CallCachingOff',
        },
        inputs: {
          docker: 'quay.io/broadinstitute/ncbi-tools:2.10.7.10',
          disk_size: 750,
          SRA_ID: 'ERR4868270',
          machine_mem_gb: null,
        },
        returnCode: 2,
        backend: 'TES',
        end: '2024-01-11T19:49:32.350Z',
        start: '2024-01-11T19:36:15.842Z',
        retryableFailure: true,
        executionStatus: 'RetryableFailure',
        backendStatus: 'Complete',
        compressedDockerSize: 1339143280,
        failures: [
          {
            message:
              "Job fetch_sra_to_bam.Fetch_SRA_to_BAM:NA:1 exited with return code 2 which has not been declared as a valid return code. See 'continueOnReturnCode' runtime attribute for more details.",
            causedBy: [],
          },
        ],
        jobId: '0f25918d_bcf27511ec024b439fb1afa092ba2b91',
        stderr:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/execution/stderr',
        callRoot:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM',
        attempt: 1,
        executionEvents: [
          {
            startTime: '2024-01-11T19:36:18.331Z',
            description: 'PreparingJob',
            endTime: '2024-01-11T19:36:18.352Z',
          },
          {
            startTime: '2024-01-11T19:36:18.331Z',
            description: 'WaitingForValueStore',
            endTime: '2024-01-11T19:36:18.331Z',
          },
          {
            startTime: '2024-01-11T19:36:15.842Z',
            description: 'Pending',
            endTime: '2024-01-11T19:36:15.842Z',
          },
          {
            startTime: '2024-01-11T19:36:15.842Z',
            description: 'RequestingExecutionToken',
            endTime: '2024-01-11T19:36:18.331Z',
          },
          {
            startTime: '2024-01-11T19:36:18.352Z',
            description: 'RunningJob',
            endTime: '2024-01-11T19:49:32.148Z',
          },
          {
            startTime: '2024-01-11T19:49:32.148Z',
            description: 'UpdatingJobStore',
            endTime: '2024-01-11T19:49:32.350Z',
          },
        ],
      },
      {
        tes_stderr:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/tes_task/stderr.txt',
        tes_stdout:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/tes_task/stdout.txt',
        executionStatus: 'Done',
        stdout:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/stdout',
        commandLine:
          "set -e\n# fetch SRA metadata on this record\nesearch -db sra -q \"ERR4868270\" | efetch -mode json -json > SRA.json\ncp SRA.json \"ERR4868270.json\"\n\n# pull reads from SRA and make a fully annotated BAM -- must succeed\nCENTER=$(jq -r .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SUBMISSION.center_name SRA.json)\nPLATFORM=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM | keys[] as $k | \"\\($k)\"' SRA.json)\nMODEL=$(jq -r \".EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM.$PLATFORM.INSTRUMENT_MODEL\" SRA.json)\nSAMPLE=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.IDENTIFIERS.EXTERNAL_ID|select(.namespace == \"BioSample\")|.content' SRA.json)\nLIBRARY=$(jq -r .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.alias SRA.json)\nRUNDATE=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.RUN_SET.RUN.SRAFiles|if (.SRAFile|type) == \"object\" then .SRAFile.date else [.SRAFile[]|select(.supertype == \"Original\")][0].date end' SRA.json | cut -f 1 -d ' ')\n\nif [ \"$PLATFORM\" = \"OXFORD_NANOPORE\" ]; then\n    # per the SAM/BAM specification\n    SAM_PLATFORM=\"ONT\"\nelse\n    SAM_PLATFORM=\"$PLATFORM\"\nfi\n\nsam-dump --unaligned --header \"ERR4868270\" \\\n    | samtools view -bhS - \\\n    > temp.bam\npicard AddOrReplaceReadGroups \\\n    I=temp.bam \\\n    O=\"ERR4868270.bam\" \\\n    RGID=1 \\\n    RGLB=\"$LIBRARY\" \\\n    RGSM=\"$SAMPLE\" \\\n    RGPL=\"$SAM_PLATFORM\" \\\n    RGPU=\"$LIBRARY\" \\\n    RGPM=\"$MODEL\" \\\n    RGDT=\"$RUNDATE\" \\\n    RGCN=\"$CENTER\" \\\n    VALIDATION_STRINGENCY=SILENT\nrm temp.bam\nsamtools view -H \"ERR4868270.bam\"\n\n# emit numeric WDL outputs\necho $CENTER > OUT_CENTER\necho $PLATFORM > OUT_PLATFORM\necho $SAMPLE > OUT_BIOSAMPLE\necho $LIBRARY > OUT_LIBRARY\necho $RUNDATE > OUT_RUNDATE\nsamtools view -c \"ERR4868270.bam\" | tee OUT_NUM_READS\n\n# pull other metadata from SRA -- allow for silent failures here!\ntouch OUT_MODEL OUT_COLLECTION_DATE OUT_STRAIN OUT_COLLECTED_BY OUT_GEO_LOC\nset +e\njq -r \\\n    .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM.\"$PLATFORM\".INSTRUMENT_MODEL \\\n    SRA.json | tee OUT_MODEL\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"collection_date\" or .TAG==\"collection date\")|.VALUE' \\\n    SRA.json | tee OUT_COLLECTION_DATE\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"strain\")|.VALUE' \\\n    SRA.json | tee OUT_STRAIN\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"collected_by\" or .TAG == \"collecting institution\")|.VALUE' \\\n    SRA.json | tee OUT_COLLECTED_BY\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"geo_loc_name\" or .TAG == \"geographic location (country and/or sea)\")|.VALUE' \\\n    SRA.json | tee OUT_GEO_LOC\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.DESIGN.LIBRARY_DESCRIPTOR.LIBRARY_STRATEGY' \\\n    SRA.json | tee OUT_LIBRARY_STRATEGY\n\nset -e\npython3 << CODE\nimport json\nwith open('SRA.json', 'rt') as inf:\n    meta = json.load(inf)\n# reorganize to look more like a biosample attributes tsv\nbiosample = dict((x['TAG'],x['VALUE']) for x in meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['SAMPLE']['SAMPLE_ATTRIBUTES']['SAMPLE_ATTRIBUTE'])\nbiosample['accession'] = meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['SAMPLE']['IDENTIFIERS']['EXTERNAL_ID']['content']\nbiosample['message'] = 'Successfully loaded'\nbiosample['bioproject_accession'] = meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['STUDY']['IDENTIFIERS']['EXTERNAL_ID']['content']\nbiosample['sample_name'] = biosample['isolate']\nfor k,v in biosample.items():\n    if v == 'not provided':\n        biosample[k] = ''\n\n# British to American conversions (NCBI vs ENA)\nus_to_uk = {\n    'sample_name': 'Sample Name',\n    'isolate': 'Sample Name',\n    'collected_by': 'collecting institution',\n    'collection_date': 'collection date',\n    'geo_loc_name': 'geographic location (country and/or sea)',\n    'host': 'host scientific name',\n}\nfor key_us, key_uk in us_to_uk.items():\n    if not biosample.get(key_us,''):\n        biosample[key_us] = biosample.get(key_uk,'')\n\n# write outputs\nwith open('ERR4868270-biosample_attributes.json', 'wt') as outf:\n    json.dump(biosample, outf)\nCODE",
        shardIndex: -1,
        outputs: {
          library_id: 'COG-UK/CAMB-1B8D87/CAMB:20201106_2020_X5_FAO13851_8f36dbb7',
          sample_collection_date: '2020-10-31',
          biosample_accession: 'SAMEA7612766',
          run_date: '2022-06-17',
          sra_metadata:
            'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/ERR4868270.json',
          library_strategy: 'AMPLICON',
          num_reads: 96323,
          sequencing_center: 'Department of Pathology, University of Cambridge',
          reads_ubam:
            'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/ERR4868270.bam',
          sample_strain: '',
          biosample_attributes_json:
            'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/ERR4868270-biosample_attributes.json',
          sample_geo_loc: 'United Kingdom',
          sequencing_platform: 'OXFORD_NANOPORE',
          sample_collected_by: 'Department of Pathology, University of Cambridge',
          sequencing_platform_model: 'GridION',
        },
        runtimeAttributes: {
          preemptible: 'true',
          disk: '750 GB',
          failOnStderr: 'false',
          disks: 'local-disk 750 LOCAL',
          continueOnReturnCode: '0',
          docker: 'quay.io/broadinstitute/ncbi-tools:2.10.7.10',
          maxRetries: '2',
          cpu: '2',
          memory: '6 GB',
        },
        callCaching: {
          allowResultReuse: false,
          effectiveCallCachingMode: 'CallCachingOff',
        },
        inputs: {
          docker: 'quay.io/broadinstitute/ncbi-tools:2.10.7.10',
          disk_size: 750,
          SRA_ID: 'ERR4868270',
          machine_mem_gb: null,
        },
        returnCode: 0,
        jobId: '0f25918d_de170193faa14a55a598253862d19ac3',
        backend: 'TES',
        start: '2024-01-11T19:49:32.441Z',
        backendStatus: 'Complete',
        compressedDockerSize: 1339143280,
        end: '2024-01-11T19:58:55.375Z',
        dockerImageUsed: 'quay.io/broadinstitute/ncbi-tools@sha256:c6228528a9fa7d3abd78d40821231ec49c122f8c10bb27ae603540c46fc05797',
        stderr:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/stderr',
        callRoot:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2',
        attempt: 2,
        executionEvents: [
          {
            startTime: '2024-01-11T19:58:55.139Z',
            description: 'UpdatingJobStore',
            endTime: '2024-01-11T19:58:55.375Z',
          },
          {
            startTime: '2024-01-11T19:49:33.340Z',
            description: 'RunningJob',
            endTime: '2024-01-11T19:58:55.139Z',
          },
          {
            startTime: '2024-01-11T19:49:32.441Z',
            description: 'RequestingExecutionToken',
            endTime: '2024-01-11T19:49:33.331Z',
          },
          {
            startTime: '2024-01-11T19:49:32.441Z',
            description: 'Pending',
            endTime: '2024-01-11T19:49:32.441Z',
          },
          {
            startTime: '2024-01-11T19:49:33.331Z',
            description: 'PreparingJob',
            endTime: '2024-01-11T19:49:33.340Z',
          },
          {
            startTime: '2024-01-11T19:49:33.331Z',
            description: 'WaitingForValueStore',
            endTime: '2024-01-11T19:49:33.331Z',
          },
        ],
      },
    ],
  },
  outputs: {
    'fetch_sra_to_bam.sra_metadata':
      'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/ERR4868270.json',
    'fetch_sra_to_bam.reads_ubam':
      'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/ERR4868270.bam',
    'fetch_sra_to_bam.biosample_accession': 'SAMEA7612766',
    'fetch_sra_to_bam.sample_geo_loc': 'United Kingdom',
    'fetch_sra_to_bam.sample_collection_date': '2020-10-31',
    'fetch_sra_to_bam.sequencing_center': 'Department of Pathology, University of Cambridge',
    'fetch_sra_to_bam.sequencing_platform': 'OXFORD_NANOPORE',
    'fetch_sra_to_bam.library_id': 'COG-UK/CAMB-1B8D87/CAMB:20201106_2020_X5_FAO13851_8f36dbb7',
    'fetch_sra_to_bam.run_date': '2022-06-17',
    'fetch_sra_to_bam.sample_collected_by': 'Department of Pathology, University of Cambridge',
    'fetch_sra_to_bam.sample_strain': '',
    'fetch_sra_to_bam.sequencing_platform_model': 'GridION',
  },
  workflowRoot:
    'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993',
  actualWorkflowLanguage: 'WDL',
  status: 'Succeeded',
  workflowLog:
    'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-a5150ece-9040-4ff2-8206-375c1e492be5/cromwell-workflow-logs/workflow.0f25918d-f370-4e2d-8d65-0acaf0fe8993.log',
  workflowCallback: {
    url: 'https://lz7388ada396994bb48ea5c87a02eed673689c82c2af423d03.servicebus.windows.net/terra-app-a5150ece-9040-4ff2-8206-375c1e492be5-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/cbas/api/batch/v1/runs/results',
    successful: true,
    timestamp: '2024-01-11T19:58:59.520950Z',
  },
  end: '2024-01-11T19:58:56.503Z',
  start: '2024-01-11T19:36:14.602Z',
  id: '0f25918d-f370-4e2d-8d65-0acaf0fe8993',
  inputs: {
    'fetch_sra_to_bam.Fetch_SRA_to_BAM.machine_mem_gb': null,
    'fetch_sra_to_bam.Fetch_SRA_to_BAM.SRA_ID': 'ERR4868270',
    'fetch_sra_to_bam.Fetch_SRA_to_BAM.docker': 'quay.io/broadinstitute/ncbi-tools:2.10.7.10',
  },
  labels: {
    'cromwell-workflow-id': 'cromwell-0f25918d-f370-4e2d-8d65-0acaf0fe8993',
  },
  submission: '2024-01-11T19:35:34.627Z',
};

// Necessary to mock the AJAX module.
jest.mock('src/libs/ajax');
jest.mock('src/libs/notifications.js');
jest.mock('src/libs/ajax/leonardo/Apps');
jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn(),
  goToPath: jest.fn(),
}));
jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: jest.fn(),
}));
// Mocking feature preview setup
jest.mock('src/libs/feature-previews', () => ({
  ...jest.requireActual('src/libs/feature-previews'),
  isFeaturePreviewEnabled: jest.fn(),
}));

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({ cbasUrlRoot, cromwellUrlRoot, wdsUrlRoot }),
}));

// jest.mock('./utils/submission-utils.ts', () => ({
//   ...jest.requireActual('./utils/submission-utils.ts'),
//   fetchMetadata: jest.fn.mockReturnValue(mockWorkflow),
// }));

const captureEvent = jest.fn();

describe('Submission Details page', () => {
  beforeEach(() => {
    // SubmissionDetails component uses AutoSizer to determine the right size for table to be displayed. As a result we need to
    // mock out the height and width so that when AutoSizer asks for the width and height of 'browser' it can use the mocked
    // values and render the component properly. Without this the tests will be break.
    // (see https://github.com/bvaughn/react-virtualized/issues/493 and https://stackoverflow.com/a/62214834)
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  it('should correctly display previous 2 runs', async () => {
    const getRuns = jest.fn(() => Promise.resolve(mockRunsData));
    const getRunsSets = jest.fn(() => Promise.resolve(runSetData));
    const getMethods = jest.fn(() => Promise.resolve(methodData));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRuns,
          },
          runSets: {
            get: getRunsSets,
          },
          methods: {
            getById: getMethods,
          },
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
        Metrics: {
          captureEvent,
        },
        AzureStorage: {
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });

    expect(getRuns).toHaveBeenCalled();
    expect(getRunsSets).toHaveBeenCalled();
    expect(getMethods).toHaveBeenCalled();

    const table = await screen.findByRole('table');

    // Assert
    expect(table).toHaveAttribute('aria-colcount', '5');
    expect(table).toHaveAttribute('aria-rowcount', '3');

    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBe(3);

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.length).toBe(5);
    within(headers[0]).getByText('Sample ID');
    within(headers[1]).getByText('Status');
    within(headers[2]).getByText('Duration');
    within(headers[3]).getByText('Workflow ID');

    // check data rows are rendered as expected (default sorting is by duration in desc order)
    const cellsFromDataRow1 = within(rows[1]).getAllByRole('cell');
    expect(cellsFromDataRow1.length).toBe(5);
    within(cellsFromDataRow1[0]).getByText('FOO2');
    within(cellsFromDataRow1[1]).getByText('Failed');
    within(cellsFromDataRow1[2]).getByText('52 minutes 10 seconds');
    within(cellsFromDataRow1[3]).getByText('b29e84b1-ad1b-4462-a9a0-7ec849bf30a8');

    const cellsFromDataRow2 = within(rows[2]).getAllByRole('cell');
    expect(cellsFromDataRow2.length).toBe(5);
    within(cellsFromDataRow2[0]).getByText('FOO1');
    within(cellsFromDataRow2[1]).getByText('Succeeded');
    within(cellsFromDataRow2[2]).getByText('37 seconds');
    within(cellsFromDataRow2[3]).getByText('d16721eb-8745-4aa2-b71e-9ade2d6575aa');
  });

  it('should display standard message when there are no saved workflows', async () => {
    const getRuns = jest.fn(() => Promise.resolve([]));
    const getRunsSets = jest.fn(() => Promise.resolve(runSetData));
    const getMethods = jest.fn(() => Promise.resolve(methodData));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRuns,
          },
          runSets: {
            get: getRunsSets,
          },
          methods: {
            getById: getMethods,
          },
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
        Metrics: {
          captureEvent,
        },
        AzureStorage: {
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });

    expect(getRuns).toHaveBeenCalled();
    expect(getRunsSets).toHaveBeenCalled();
    expect(getMethods).toHaveBeenCalled();

    const table = await screen.findByRole('table');

    // Assert
    expect(table).toHaveAttribute('aria-colcount', '5');
    expect(table).toHaveAttribute('aria-rowcount', '1');

    // check that noContentMessage shows up as expected
    screen.getByText('Nothing here yet! Your previously run workflows will be displayed here.');
  });

  it('should sort by duration column properly', async () => {
    const user = userEvent.setup();
    const getRuns = jest.fn(() => Promise.resolve(mockRunsData));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRuns,
          },
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
        Metrics: {
          captureEvent,
        },
        AzureStorage: {
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });

    // Assert
    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBe(3);

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.length).toBe(5);

    // Act - click on sort button on Duration column to sort by ascending order
    await user.click(await within(headers[2]).findByRole('button'));

    // Assert
    // check that rows are now sorted by duration in ascending order
    const cellsFromDataRow1 = within(rows[1]).getAllByRole('cell');
    expect(cellsFromDataRow1.length).toBe(5);
    within(cellsFromDataRow1[0]).getByText('FOO1');
    within(cellsFromDataRow1[1]).getByText('Succeeded');
    within(cellsFromDataRow1[2]).getByText('37 seconds');
    within(cellsFromDataRow1[3]).getByText('d16721eb-8745-4aa2-b71e-9ade2d6575aa');

    const cellsFromDataRow2 = within(rows[2]).getAllByRole('cell');
    expect(cellsFromDataRow2.length).toBe(5);
    within(cellsFromDataRow2[0]).getByText('FOO2');
    within(cellsFromDataRow2[1]).getByText('Failed');
    within(cellsFromDataRow2[2]).getByText('52 minutes 10 seconds');
    within(cellsFromDataRow2[3]).getByText('b29e84b1-ad1b-4462-a9a0-7ec849bf30a8');

    // Act - click on sort button on Duration column to sort by descending order
    await user.click(await within(headers[2]).findByRole('button'));

    // Assert
    // check that rows are now sorted by duration in descending order
    const cellsFromUpdatedDataRow1 = within(rows[1]).getAllByRole('cell');
    expect(cellsFromUpdatedDataRow1.length).toBe(5);
    within(cellsFromUpdatedDataRow1[0]).getByText('FOO2');
    within(cellsFromUpdatedDataRow1[1]).getByText('Failed');
    within(cellsFromUpdatedDataRow1[2]).getByText('52 minutes 10 seconds');
    within(cellsFromUpdatedDataRow1[3]).getByText('b29e84b1-ad1b-4462-a9a0-7ec849bf30a8');

    const cellsFromUpdatedDataRow2 = within(rows[2]).getAllByRole('cell');
    expect(cellsFromUpdatedDataRow2.length).toBe(5);
    within(cellsFromUpdatedDataRow2[0]).getByText('FOO1');
    within(cellsFromUpdatedDataRow2[1]).getByText('Succeeded');
    within(cellsFromUpdatedDataRow2[2]).getByText('37 seconds');
    within(cellsFromUpdatedDataRow2[3]).getByText('d16721eb-8745-4aa2-b71e-9ade2d6575aa');
  });

  it('display run set details', async () => {
    const getRuns = jest.fn(() => Promise.resolve(mockRunsData));
    const getRunsSets = jest.fn(() => Promise.resolve(runSetData));
    const getMethods = jest.fn(() => Promise.resolve(methodData));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRuns,
          },
          runSets: {
            get: getRunsSets,
          },
          methods: {
            getById: getMethods,
          },
        },
        Metrics: {
          captureEvent,
        },
        AzureStorage: {
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
      };
    });
    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });
    expect(getRunsSets).toHaveBeenCalled();
    expect(getMethods).toHaveBeenCalled();

    screen.getByText(/Submission e8347247-4738-4ad1-a591-56c119f93f58/);
    screen.getByText(/Submission name: hello world/);
    screen.getByText(/Workflow name: Hello world/);
    screen.getByText(/Submission date: Dec 8, 2022/);
    screen.getByText(/Duration: 17 hours 2 minutes/);
  });

  it('should correctly set default option', async () => {
    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });

    screen.getByText(/None selected/);
  });

  it('should correctly select and change results', async () => {
    const user = userEvent.setup();
    const getRuns = jest.fn(() => Promise.resolve(mockRunsData));
    const getRunsSets = jest.fn(() => Promise.resolve(runSetData));
    const getMethods = jest.fn(() => Promise.resolve(methodData));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRuns,
          },
          runSets: {
            get: getRunsSets,
          },
          methods: {
            getById: getMethods,
          },
        },
        Metrics: {
          captureEvent,
        },
        AzureStorage: {
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });

    expect(getRuns).toHaveBeenCalled();
    expect(getRunsSets).toHaveBeenCalled();
    expect(getMethods).toHaveBeenCalled();

    const dropdown = await screen.findByLabelText('Filter selection');
    const filterDropdown = new SelectHelper(dropdown, user);
    await filterDropdown.selectOption('Error');

    const table = await screen.findByRole('table');

    // Assert
    expect(table).toHaveAttribute('aria-colcount', '5');
    expect(table).toHaveAttribute('aria-rowcount', '2');

    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBe(2);

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.length).toBe(5);
    within(headers[0]).getByText('Sample ID');
    within(headers[1]).getByText('Status');
    within(headers[2]).getByText('Duration');
    within(headers[3]).getByText('Workflow ID');

    // check data rows are rendered as expected
    const cellsFromDataRow1 = within(rows[1]).getAllByRole('cell');
    expect(cellsFromDataRow1.length).toBe(5);
    within(cellsFromDataRow1[0]).getByText('FOO2');
    within(cellsFromDataRow1[1]).getByText('Failed');
    within(cellsFromDataRow1[2]).getByText('52 minutes 10 seconds');
    within(cellsFromDataRow1[3]).getByText('b29e84b1-ad1b-4462-a9a0-7ec849bf30a8');
  });

  it('should correctly display a very recently started run', async () => {
    const recentRunsData = {
      runs: [
        {
          run_id: 'b7234aae-6f43-405e-bb3a-71f924e09825',
          engine_id: 'b29e84b1-ad1b-4462-a9a0-7ec849bf30a8',
          run_set_id: '0cd15673-7342-4cfa-883d-819660184a16',
          record_id: 'FOO2',
          workflow_url: 'https://xyz.wdl',
          state: 'UNKNOWN',
          workflow_params:
            "[{'input_name':'wf_hello.hello.addressee','input_type':{'type':'primitive','primitive_type':'String'},'source':{'type':'record_lookup','record_attribute':'foo_name'}}]",
          workflow_outputs: '[]',
          submission_date: new Date().toISOString(),
          last_modified_timestamp: new Date().toISOString(),
          error_messages: [],
        },
      ],
    };

    const getRecentRunsMethod = jest.fn(() => Promise.resolve(recentRunsData));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRecentRunsMethod,
          },
        },
        Metrics: {
          captureEvent,
        },
        AzureStorage: {
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });

    const table = await screen.findByRole('table');

    // Assert
    expect(table).toHaveAttribute('aria-colcount', '5');
    expect(table).toHaveAttribute('aria-rowcount', '2');

    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBe(2);

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.length).toBe(5);
    within(headers[0]).getByText('Sample ID');
    within(headers[1]).getByText('Status');
    within(headers[2]).getByText('Duration');

    // check data rows are rendered as expected
    const cellsFromDataRow1 = within(rows[1]).getAllByRole('cell');
    expect(cellsFromDataRow1.length).toBe(5);
    within(cellsFromDataRow1[0]).getByText('FOO2');
    within(cellsFromDataRow1[1]).getByText('Initializing'); // Note: not UNKNOWN!
    // << Don't validate duration here since it depends on the test rendering time and is not particularly relevant >>
    within(cellsFromDataRow1[3]).getByText('b29e84b1-ad1b-4462-a9a0-7ec849bf30a8');
  });

  it('should correctly display a run with undefined engine id', async () => {
    const recentRunsData = {
      runs: [
        {
          run_id: 'b7234aae-6f43-405e-bb3a-71f924e09825',
          // engine_id is undefined
          run_set_id: '0cd15673-7342-4cfa-883d-819660184a16',
          record_id: 'FOO2',
          workflow_url: 'https://xyz.wdl',
          state: 'UNKNOWN',
          workflow_params:
            "[{'input_name':'wf_hello.hello.addressee','input_type':{'type':'primitive','primitive_type':'String'},'source':{'type':'record_lookup','record_attribute':'foo_name'}}]",
          workflow_outputs: '[]',
          submission_date: new Date().toISOString(),
          last_modified_timestamp: new Date().toISOString(),
          error_messages: [],
        },
      ],
    };

    const getRecentRunsMethod = jest.fn(() => Promise.resolve(recentRunsData));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRecentRunsMethod,
          },
        },
        Metrics: {
          captureEvent,
        },
        AzureStorage: {
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });

    const table = await screen.findByRole('table');

    // Assert
    expect(table).toHaveAttribute('aria-colcount', '5');
    expect(table).toHaveAttribute('aria-rowcount', '2');

    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBe(2);

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.length).toBe(5);
    within(headers[0]).getByText('Sample ID');
    within(headers[1]).getByText('Status');
    within(headers[2]).getByText('Duration');

    // check data rows are rendered as expected
    const cellsFromDataRow1 = within(rows[1]).getAllByRole('cell');
    expect(cellsFromDataRow1.length).toBe(5);
    within(cellsFromDataRow1[0]).getByText('FOO2');
    within(cellsFromDataRow1[1]).getByText('Initializing'); // Note: not UNKNOWN!
    // << Don't validate duration here since it depends on the test rendering time and is not particularly relevant >>
    within(cellsFromDataRow1[3]).getByText('');
  });

  it('should indicate fully updated polls', async () => {
    const getRecentRunsMethod = jest.fn(() => Promise.resolve(simpleRunsData));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRecentRunsMethod,
          },
        },
        Metrics: {
          captureEvent,
        },
        AzureStorage: {
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });

    expect(screen.getByText('Workflow statuses are all up to date.')).toBeInTheDocument();
  });

  it('should indicate incompletely updated polls', async () => {
    const getRecentRunsMethod = jest.fn(() => Promise.resolve(_.merge(simpleRunsData, { fully_updated: false })));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRecentRunsMethod,
          },
        },
        Metrics: {
          captureEvent,
        },
        AzureStorage: {
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });

    expect(screen.getByText('Some workflow statuses are not up to date. Refreshing the page may update more statuses.')).toBeInTheDocument();
  });

  it('should display inputs on the Inputs tab', async () => {
    // Arrange
    const user = userEvent.setup();
    const getRuns = jest.fn(() => Promise.resolve(mockRunsData));
    const getRunsSets = jest.fn(() => Promise.resolve(runSetData));
    const getMethods = jest.fn(() => Promise.resolve(methodData));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRuns,
          },
          runSets: {
            get: getRunsSets,
          },
          methods: {
            getById: getMethods,
          },
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
        Metrics: {
          captureEvent,
        },
        AzureStorage: {
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });

    const workflowsTabButton = screen.getByRole('tab', { name: 'Workflows' });
    expect(workflowsTabButton !== undefined);

    const inputsTabButton = screen.getByRole('tab', { name: 'Inputs' });
    expect(inputsTabButton !== undefined);

    // ** ACT **
    // user clicks on inputs tab button
    await user.click(inputsTabButton);

    // Assert
    const inputTable = screen.getByRole('table');
    const rows = within(inputTable).getAllByRole('row');
    expect(rows.length).toBe(JSON.parse(runSetData.run_sets[0].input_definition).length + 1); // one row for each input definition variable, plus headers

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.length).toBe(5);

    const row1cells = within(rows[1]).getAllByRole('cell');
    expect(row1cells.length).toBe(5);
    expect(row1cells[0]).toHaveTextContent('hello');
    expect(row1cells[1]).toHaveTextContent('addressee');
    expect(row1cells[2]).toHaveTextContent('String');
    expect(row1cells[3]).toHaveTextContent('record_lookup');
    expect(row1cells[4]).toHaveTextContent('foo_name');
  });

  it('should display outputs on the Outputs tab', async () => {
    // Add output definition to temporary runset data variable
    const tempRunSetData = runSetData;
    tempRunSetData.run_sets[0].output_definition = runSetResponse.run_sets[0].output_definition;

    // Arrange
    const user = userEvent.setup();
    const getRuns = jest.fn(() => Promise.resolve(mockRunsData));
    const getRunsSets = jest.fn(() => Promise.resolve(tempRunSetData));
    const getMethods = jest.fn(() => Promise.resolve(methodData));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRuns,
          },
          runSets: {
            get: getRunsSets,
          },
          methods: {
            getById: getMethods,
          },
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
        Metrics: {
          captureEvent,
        },
        AzureStorage: {
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
        })
      );
    });

    const outputsTabButton = screen.getByRole('tab', { name: 'Outputs' });
    expect(outputsTabButton !== undefined);

    // ** ACT **
    // user clicks on outputs tab button
    await user.click(outputsTabButton);

    // Assert
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBe(runSetOutputDef.length + 1); // one row for each output definition variable, plus headers

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.length).toBe(4);

    const row1cells = within(rows[1]).getAllByRole('cell');
    expect(row1cells.length).toBe(4);
    expect(row1cells[0]).toHaveTextContent('target_workflow_1');
    expect(row1cells[1]).toHaveTextContent('file_output');
    expect(row1cells[2]).toHaveTextContent('File');
    expect(row1cells[3]).toHaveTextContent('target_workflow_1_file_output'); // from previous run/template

    const row2cells = within(rows[2]).getAllByRole('cell');
    expect(row2cells.length).toBe(4);
    expect(row2cells[0]).toHaveTextContent('target_workflow_1');
    expect(row2cells[1]).toHaveTextContent('unused_output');
    expect(row2cells[2]).toHaveTextContent('String');
    expect(row2cells[3]).toHaveTextContent('');
  });

  // it('should open the log viewer modal when Execution Logs button is clicked', async () => {
  //   // Arrange
  //   const user = userEvent.setup();
  //   const getRuns = jest.fn(() => Promise.resolve(mockRunsData));
  //   const getRunsSets = jest.fn(() => Promise.resolve(runSetData));
  //   const getMethods = jest.fn(() => Promise.resolve(methodData));
  //   const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));
  //   Ajax.mockImplementation(() => {
  //     return {
  //       Cbas: {
  //         runs: {
  //           get: getRuns,
  //         },
  //         runSets: {
  //           get: getRunsSets,
  //         },
  //         methods: {
  //           getById: getMethods,
  //         },
  //       },
  //       Apps: {
  //         listAppsV2: mockLeoResponse,
  //       },
  //       CromwellApp: {
  //         workflows: () => {
  //           return {
  //             metadata: jest.fn(() => {
  //               return Promise.resolve(runDetailsMetadata);
  //             }),
  //             failedTasks: jest.fn(() => {
  //               return Promise.resolve(failedTasksMetadata);
  //             }),
  //           };
  //         },
  //         callCacheDiff: jest.fn(() => {
  //           return Promise.resolve(callCacheDiff);
  //         }),
  //       },
  //       AzureStorage: {
  //         blobByUri: jest.fn(() => ({
  //           getMetadataAndTextContent: () =>
  //             Promise.resolve({
  //               uri: 'https://someBlobFilePath.blob.core.windows.net/cromwell/user-inputs/inputFile.txt',
  //               sasToken: '1234-this-is-a-mock-sas-token-5678',
  //               fileName: 'inputFile.txt',
  //               name: 'inputFile.txt',
  //               lastModified: 'Mon, 22 May 2023 17:12:58 GMT',
  //               size: '324',
  //               contentType: 'text/plain',
  //               textContent: 'this is the text of a mock file',
  //               azureSasStorageUrl: 'https://someBlobFilePath.blob.core.windows.net/cromwell/user-inputs/inputFile.txt',
  //             }),
  //         })),
  //         details: jest.fn(() => {
  //           return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
  //         }),
  //       },
  //       Metrics: {
  //         captureEvent,
  //       },
  //     };
  //   });

  //   // Act
  //   await act(async () => {
  //     render(
  //       h(BaseSubmissionDetails, {
  //         name: 'test-azure-ws-name',
  //         namespace: 'test-azure-ws-namespace',
  //         workspace: mockAzureWorkspace,
  //         submissionId,
  //         workflowId: '00001111-2222-3333-aaaa-bbbbccccdddd',
  //         uri: 'https://coaexternalstorage.blob.core.windows.net/cromwell/user-inputs/inputFile.txt',
  //       })
  //     );
  //   });

  //   const executionLogsButtons = screen.getAllByRole('button', { name: 'Logs' });
  //   expect(executionLogsButtons !== undefined);

  //   // for (const executionLogsButton of executionLogsButtons) {
  //   //   // Act
  //   //   await user.click(executionLogsButton);
  //   //   screen.logTestingPlaygroundURL();
  //   // }
  //   // Act
  //   await user.click(executionLogsButtons[0]);
  //   // screen.logTestingPlaygroundURL();
  // });

  it('should open the log viewer modal when Inputs button is clicked', async () => {
    jest.mock('src/workflows-app/SubmissionDetails.js', () => ({
      ...jest.requireActual('src/workflows-app/SubmissionDetails.js'),
      loadRuns: jest.fn.mockReturnValue(Promise.resolve(mockRunsData)),
    }));

    jest.mock('./utils/submission-utils.ts', () => ({
      ...jest.requireActual('./utils/submission-utils.ts'),
      fetchMetadata: jest.fn.mockReturnValue(Promise.resolve(mockWorkflow)),
    }));

    // Arrange
    const user = userEvent.setup();
    const getRuns = jest.fn(() => Promise.resolve(mockRunsData));
    // const getRuns = fetchMetadata().then();
    const getRunsSets = jest.fn(() => Promise.resolve(runSetData));
    const getMethods = jest.fn(() => Promise.resolve(methodData));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));
    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runs: {
            get: getRuns,
          },
          runSets: {
            get: getRunsSets,
          },
          methods: {
            getById: getMethods,
          },
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
        CromwellApp: {
          workflows: () => {
            return {
              metadata: jest.fn(() => {
                return Promise.resolve(runDetailsMetadata);
              }),
              failedTasks: jest.fn(() => {
                return Promise.resolve(failedTasksMetadata);
              }),
            };
          },
          callCacheDiff: jest.fn(() => {
            return Promise.resolve(callCacheDiff);
          }),
        },
        AzureStorage: {
          blobByUri: jest.fn(() => ({
            getMetadataAndTextContent: () =>
              Promise.resolve({
                uri: 'https://someBlobFilePath.blob.core.windows.net/cromwell/user-inputs/inputFile.txt',
                sasToken: '1234-this-is-a-mock-sas-token-5678',
                fileName: 'inputFile.txt',
                name: 'inputFile.txt',
                lastModified: 'Mon, 22 May 2023 17:12:58 GMT',
                size: '324',
                contentType: 'text/plain',
                textContent: 'this is the text of a mock file',
                azureSasStorageUrl: 'https://someBlobFilePath.blob.core.windows.net/cromwell/user-inputs/inputFile.txt',
              }),
          })),
          details: jest.fn(() => {
            return Promise.resolve({ sas: { token: '1234-this-is-a-mock-sas-token-5678' } });
          }),
        },
        Metrics: {
          captureEvent,
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionDetails, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          submissionId,
          workflowId: '00001111-2222-3333-aaaa-bbbbccccdddd',
          uri: 'https://coaexternalstorage.blob.core.windows.net/cromwell/user-inputs/inputFile.txt',
        })
      );
    });

    screen.logTestingPlaygroundURL();

    const inputsButtons = screen.getAllByRole('button', { name: 'Inputs' });
    expect(inputsButtons !== undefined);

    // for (const executionLogsButton of executionLogsButtons) {
    //   // Act
    //   await user.click(executionLogsButton);
    //   screen.logTestingPlaygroundURL();
    // }
    // Act
    await user.click(inputsButtons[0]);
  });
});
