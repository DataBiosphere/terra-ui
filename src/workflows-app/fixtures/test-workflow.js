export const metadata = {
  workflowName: 'fetch_sra_to_bam',
  workflowProcessingEvents: [
    {
      cromwellId: 'cromid-e70311e',
      description: 'PickedUp',
      timestamp: '2023-05-22T11:10:42.600Z',
      cromwellVersion: '86-17efd59',
    },
    {
      cromwellId: 'cromid-e70311e',
      description: 'Finished',
      timestamp: '2023-05-22T11:22:33.705Z',
      cromwellVersion: '86-17efd59',
    },
  ],
  actualWorkflowLanguageVersion: '1.0',
  submittedFiles: {
    workflow:
      'version 1.0\n\nimport "../tasks/tasks_ncbi_tools.wdl" as ncbi_tools\n\nworkflow fetch_sra_to_bam {\n    meta {\n        description: "Retrieve reads from the NCBI Short Read Archive in unaligned BAM format with relevant metadata encoded."\n        author: "Broad Viral Genomics"\n        email:  "viral-ngs@broadinstitute.org"\n        allowNestedInputs: true\n    }\n\n    call ncbi_tools.Fetch_SRA_to_BAM\n\n    output {\n        File   reads_ubam                = Fetch_SRA_to_BAM.reads_ubam\n        String sequencing_center         = Fetch_SRA_to_BAM.sequencing_center\n        String sequencing_platform       = Fetch_SRA_to_BAM.sequencing_platform\n        String sequencing_platform_model = Fetch_SRA_to_BAM.sequencing_platform_model\n        String biosample_accession       = Fetch_SRA_to_BAM.biosample_accession\n        String library_id                = Fetch_SRA_to_BAM.library_id\n        String run_date                  = Fetch_SRA_to_BAM.run_date\n        String sample_collection_date    = Fetch_SRA_to_BAM.sample_collection_date\n        String sample_collected_by       = Fetch_SRA_to_BAM.sample_collected_by\n        String sample_strain             = Fetch_SRA_to_BAM.sample_strain\n        String sample_geo_loc            = Fetch_SRA_to_BAM.sample_geo_loc\n        File   sra_metadata              = Fetch_SRA_to_BAM.sra_metadata\n    }\n}\n',
    root: '',
    options:
      '{\n  "final_workflow_log_dir": "https://kj4l5k3hjklk3jlk43jl3kj43lkj3l4kj3.blob.core.windows.net/sc-random-value/workspace-services/cbas/terra-app-other-random-value/cromwell-workflow-logs"\n}',
    inputs: '{"fetch_sra_to_bam.Fetch_SRA_to_BAM.SRA_ID":"SRR13379731"}',
    workflowUrl: 'https://raw.githubusercontent.com/broadinstitute/viral-pipelines/v2.1.33.16/pipes/WDL/workflows/fetch_sra_to_bam.wdl',
    labels: '{}',
  },
  calls: {
    'fetch_sra_to_bam.Fetch_SRA_to_BAM': [
      {
        executionStatus: 'Done',
        stdout:
          'https://kj4l5k3hjklk3jlk43jl3kj43lkj3l4kj3.blob.core.windows.net/sc-random-value/workspace-services/cbas/terra-app-other-random-value/fetch_sra_to_bam/more-random-value/call-Fetch_SRA_to_BAM/execution/stdout',
        commandLine:
          "set -e\n# fetch SRA metadata on this record\nesearch -db sra -q \"SRR13379731\" | efetch -mode json -json > SRA.json\ncp SRA.json \"SRR13379731.json\"\n\n# pull reads from SRA and make a fully annotated BAM -- must succeed\nCENTER=$(jq -r .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SUBMISSION.center_name SRA.json)\nPLATFORM=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM | keys[] as $k | \"\\($k)\"' SRA.json)\nMODEL=$(jq -r \".EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM.$PLATFORM.INSTRUMENT_MODEL\" SRA.json)\nSAMPLE=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.IDENTIFIERS.EXTERNAL_ID|select(.namespace == \"BioSample\")|.content' SRA.json)\nLIBRARY=$(jq -r .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.alias SRA.json)\nRUNDATE=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.RUN_SET.RUN.SRAFiles|if (.SRAFile|type) == \"object\" then .SRAFile.date else [.SRAFile[]|select(.supertype == \"Original\")][0].date end' SRA.json | cut -f 1 -d ' ')\n\nif [ \"$PLATFORM\" = \"OXFORD_NANOPORE\" ]; then\n    # per the SAM/BAM specification\n    SAM_PLATFORM=\"ONT\"\nelse\n    SAM_PLATFORM=\"$PLATFORM\"\nfi\n\nsam-dump --unaligned --header \"SRR13379731\" \\\n    | samtools view -bhS - \\\n    > temp.bam\npicard AddOrReplaceReadGroups \\\n    I=temp.bam \\\n    O=\"SRR13379731.bam\" \\\n    RGID=1 \\\n    RGLB=\"$LIBRARY\" \\\n    RGSM=\"$SAMPLE\" \\\n    RGPL=\"$SAM_PLATFORM\" \\\n    RGPU=\"$LIBRARY\" \\\n    RGPM=\"$MODEL\" \\\n    RGDT=\"$RUNDATE\" \\\n    RGCN=\"$CENTER\" \\\n    VALIDATION_STRINGENCY=SILENT\nrm temp.bam\nsamtools view -H \"SRR13379731.bam\"\n\n# emit numeric WDL outputs\necho $CENTER > OUT_CENTER\necho $PLATFORM > OUT_PLATFORM\necho $SAMPLE > OUT_BIOSAMPLE\necho $LIBRARY > OUT_LIBRARY\necho $RUNDATE > OUT_RUNDATE\nsamtools view -c \"SRR13379731.bam\" | tee OUT_NUM_READS\n\n# pull other metadata from SRA -- allow for silent failures here!\ntouch OUT_MODEL OUT_COLLECTION_DATE OUT_STRAIN OUT_COLLECTED_BY OUT_GEO_LOC\nset +e\njq -r \\\n    .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM.\"$PLATFORM\".INSTRUMENT_MODEL \\\n    SRA.json | tee OUT_MODEL\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"collection_date\" or .TAG==\"collection date\")|.VALUE' \\\n    SRA.json | tee OUT_COLLECTION_DATE\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"strain\")|.VALUE' \\\n    SRA.json | tee OUT_STRAIN\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"collected_by\" or .TAG == \"collecting institution\")|.VALUE' \\\n    SRA.json | tee OUT_COLLECTED_BY\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"geo_loc_name\" or .TAG == \"geographic location (country and/or sea)\")|.VALUE' \\\n    SRA.json | tee OUT_GEO_LOC\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.DESIGN.LIBRARY_DESCRIPTOR.LIBRARY_STRATEGY' \\\n    SRA.json | tee OUT_LIBRARY_STRATEGY\n\nset -e\npython3 << CODE\nimport json\nwith open('SRA.json', 'rt') as inf:\n    meta = json.load(inf)\n# reorganize to look more like a biosample attributes tsv\nbiosample = dict((x['TAG'],x['VALUE']) for x in meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['SAMPLE']['SAMPLE_ATTRIBUTES']['SAMPLE_ATTRIBUTE'])\nbiosample['accession'] = meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['SAMPLE']['IDENTIFIERS']['EXTERNAL_ID']['content']\nbiosample['message'] = 'Successfully loaded'\nbiosample['bioproject_accession'] = meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['STUDY']['IDENTIFIERS']['EXTERNAL_ID']['content']\nbiosample['sample_name'] = biosample['isolate']\nfor k,v in biosample.items():\n    if v == 'not provided':\n        biosample[k] = ''\n\n# British to American conversions (NCBI vs ENA)\nus_to_uk = {\n    'sample_name': 'Sample Name',\n    'isolate': 'Sample Name',\n    'collected_by': 'collecting institution',\n    'collection_date': 'collection date',\n    'geo_loc_name': 'geographic location (country and/or sea)',\n    'host': 'host scientific name',\n}\nfor key_us, key_uk in us_to_uk.items():\n    if not biosample.get(key_us,''):\n        biosample[key_us] = biosample.get(key_uk,'')\n\n# write outputs\nwith open('SRR13379731-biosample_attributes.json', 'wt') as outf:\n    json.dump(biosample, outf)\nCODE",
        shardIndex: -1,
        outputs: {
          library_id: 'VAL-KDSC-2012556126',
          sample_collection_date: '2020-11-30',
          biosample_accession: 'SSM32424324',
          run_date: '2022-06-22',
          sra_metadata:
            'https://kj4l5k3hjklk3jlk43jl3kj43lkj3l4kj3.blob.core.windows.net/sc-random-value/workspace-services/cbas/terra-app-other-random-value/fetch_sra_to_bam/more-random-value/call-Fetch_SRA_to_BAM/execution/SRR13379731.json',
          library_strategy: 'AMPLICON',
          num_reads: 552132,
          sequencing_center: 'SQLCT',
          reads_ubam:
            'https://kj4l5k3hjklk3jlk43jl3kj43lkj3l4kj3.blob.core.windows.net/sc-random-value/workspace-services/cbas/terra-app-other-random-value/fetch_sra_to_bam/more-random-value/call-Fetch_SRA_to_BAM/execution/SRR13379731.bam',
          sample_strain: 'SARS-CoV-2/USA/44165/2020',
          biosample_attributes_json:
            'https://kj4l5k3hjklk3jlk43jl3kj43lkj3l4kj3.blob.core.windows.net/sc-random-value/workspace-services/cbas/terra-app-other-random-value/fetch_sra_to_bam/more-random-value/call-Fetch_SRA_to_BAM/execution/SRR13379731-biosample_attributes.json',
          sample_geo_loc: 'USA',
          sequencing_platform: 'Platform Company',
          sample_collected_by: 'Random',
          sequencing_platform_model: 'NextSeq 550',
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
          SRA_ID: 'sfkjl23k',
          machine_mem_gb: null,
        },
        returnCode: 0,
        jobId: '117f49d5_59bbeae7208642e686a1ca0f57c8c25a',
        backend: 'TES',
        start: '2023-05-23T10:10:43.783Z',
        backendStatus: 'Complete',
        compressedDockerSize: 1339143280,
        end: '2023-05-24T11:22:31.784Z',
        dockerImageUsed: 'docker_img_uri',
        stderr:
          'https://kj4l5k3hjklk3jlk43jl3kj43lkj3l4kj3.blob.core.windows.net/sc-random-value/workspace-services/cbas/terra-app-other-random-value/fetch_sra_to_bam/more-random-value/call-Fetch_SRA_to_BAM/execution/stderr',
        callRoot:
          'https://kj4l5k3hjklk3jlk43jl3kj43lkj3l4kj3.blob.core.windows.net/sc-random-value/workspace-services/cbas/terra-app-other-random-value/fetch_sra_to_bam/more-random-value/call-Fetch_SRA_to_BAM',
        attempt: 1,
        executionEvents: [
          {
            startTime: '2023-05-22T11:10:47.864Z',
            description: 'PreparingJob',
            endTime: '2023-05-22T11:10:47.871Z',
          },
          {
            startTime: '2023-05-22T11:10:43.783Z',
            description: 'Pending',
            endTime: '2023-05-22T11:10:43.783Z',
          },
          {
            startTime: '2023-05-22T11:10:47.871Z',
            description: 'RunningJob',
            endTime: '2023-05-22T11:22:31.608Z',
          },
          {
            startTime: '2023-05-22T11:22:31.608Z',
            description: 'UpdatingJobStore',
            endTime: '2023-05-22T11:22:31.784Z',
          },
          {
            startTime: '2023-05-22T11:10:43.783Z',
            description: 'RequestingExecutionToken',
            endTime: '2023-05-22T11:10:47.863Z',
          },
          {
            startTime: '2023-05-22T11:10:47.863Z',
            description: 'WaitingForValueStore',
            endTime: '2023-05-22T11:10:47.864Z',
          },
        ],
      },
    ],
  },
  outputs: {
    'fetch_sra_to_bam.sra_metadata':
      'https://kj4l5k3hjklk3jlk43jl3kj43lkj3l4kj3.blob.core.windows.net/sc-random-value/workspace-services/cbas/terra-app-other-random-value/fetch_sra_to_bam/more-random-value/call-Fetch_SRA_to_BAM/execution/SRR13379731.json',
    'fetch_sra_to_bam.reads_ubam':
      'https://kj4l5k3hjklk3jlk43jl3kj43lkj3l4kj3.blob.core.windows.net/sc-random-value/workspace-services/cbas/terra-app-other-random-value/fetch_sra_to_bam/more-random-value/call-Fetch_SRA_to_BAM/execution/SRR13379731.bam',
    'fetch_sra_to_bam.biosample_accession': 'kljkl2kj',
    'fetch_sra_to_bam.sample_geo_loc': 'USA',
    'fetch_sra_to_bam.sample_collection_date': '2020-11-30',
    'fetch_sra_to_bam.sequencing_center': 'SEQ_CENTER',
    'fetch_sra_to_bam.sequencing_platform': 'PLATFORM COMPANY',
    'fetch_sra_to_bam.library_id': 'ST-VALUE-2012556126',
    'fetch_sra_to_bam.run_date': '2022-06-22',
    'fetch_sra_to_bam.sample_collected_by': 'Random lab',
    'fetch_sra_to_bam.sample_strain': 'SARS-CoV-2/USA/44165/2020',
    'fetch_sra_to_bam.sequencing_platform_model': 'NextSeq 550',
  },
  workflowRoot:
    'https://kj4l5k3hjklk3jlk43jl3kj43lkj3l4kj3.blob.core.windows.net/sc-random-value/workspace-services/cbas/terra-app-other-random-value/fetch_sra_to_bam/more-random-value',
  actualWorkflowLanguage: 'WDL',
  status: 'Succeeded',
  workflowLog:
    'https://kj4l5k3hjklk3jlk43jl3kj43lkj3l4kj3.blob.core.windows.net/sc-random-value/workspace-services/cbas/terra-app-other-random-value/cromwell-workflow-logs/workflow.more-random-value.log',
  end: '2023-05-22T11:22:33.705Z',
  start: '2023-05-22T11:10:42.601Z',
  id: 'more-random-value',
  inputs: {
    'fetch_sra_to_bam.Fetch_SRA_to_BAM.SRA_ID': 'SRR13379731',
    'fetch_sra_to_bam.Fetch_SRA_to_BAM.machine_mem_gb': null,
    'fetch_sra_to_bam.Fetch_SRA_to_BAM.docker': 'quay.io/broadinstitute/ncbi-tools:2.10.7.10',
  },
  labels: {
    'cromwell-workflow-id': 'cromwell-more-random-value',
  },
  submission: '2023-05-22T11:10:00.741Z',
};
