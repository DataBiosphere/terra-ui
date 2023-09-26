import { WorkflowMethod, WorkflowMethodSet } from 'src/workflows-app/components/WorkflowCard';

export type FeaturedWorkflowMethod = WorkflowMethod & {
  template?: {
    method_input_mappings: object[];
    method_output_mappings: object[];
  };
};

export type FeaturedWorkflowSet = Omit<WorkflowMethodSet, 'methods'> & { methods: FeaturedWorkflowMethod[] };

export type FeaturedWorkflow = FeaturedWorkflowMethod | FeaturedWorkflowSet;

export const featuredWorkflowsData = [
  {
    name: 'Optimus',
    description:
      'The optimus 3 pipeline processes 10x genomics sequencing data based on the v2 chemistry. It corrects cell barcodes and UMIs, aligns reads, marks duplicates, and returns data as alignments in BAM format and as counts in sparse matrix exchange format.',
    source: 'GitHub',
    method_versions: [
      {
        name: 'Optimus_v5.8.0',
        url: 'https://raw.githubusercontent.com/broadinstitute/warp/Optimus_v5.8.0/pipelines/skylab/optimus/Optimus.wdl',
      },
    ],
    last_run: {
      previously_run: false,
    },
  },
  {
    name: 'MultiSampleSmartSeq2SingleNucleus',
    description:
      'The MultiSampleSmartSeq2SingleNucleus pipeline runs multiple snSS2 samples in a single pipeline invocation.',
    source: 'GitHub',
    method_versions: [
      {
        name: 'MultiSampleSmartSeq2SingleNucleus_v1.2.24',
        url: 'https://raw.githubusercontent.com/broadinstitute/warp/MultiSampleSmartSeq2SingleNucleus_v1.2.24/pipelines/skylab/smartseq2_single_nucleus_multisample/MultiSampleSmartSeq2SingleNucleus.wdl',
      },
    ],
    last_run: {
      previously_run: false,
    },
  },
  {
    name: 'scATAC',
    description: 'Processing of single-cell ATAC-seq data with the scATAC pipeline.',
    source: 'GitHub',
    method_versions: [
      {
        name: 'scATAC_v1.3.1',
        url: 'https://raw.githubusercontent.com/broadinstitute/warp/scATAC_v1.3.1/pipelines/skylab/scATAC/scATAC.wdl',
      },
    ],
    last_run: {
      previously_run: false,
    },
  },
  {
    name: 'WholeGenomeGermlineSingleSample',
    description: 'Processes germline whole genome sequencing data.',
    source: 'GitHub',
    method_versions: [
      {
        name: 'WholeGenomeGermlineSingleSample_v3.1.6',
        url: 'https://raw.githubusercontent.com/broadinstitute/warp/WholeGenomeGermlineSingleSample_v3.1.6/pipelines/broad/dna_seq/germline/single_sample/wgs/WholeGenomeGermlineSingleSample.wdl',
      },
    ],
    last_run: {
      previously_run: false,
    },
  },
  {
    name: 'ExomeGermlineSingleSample',
    description: 'Processes germline exome/targeted sequencing data.',
    source: 'GitHub',
    method_versions: [
      {
        name: 'ExomeGermlineSingleSample_v3.0.0',
        url: 'https://raw.githubusercontent.com/broadinstitute/warp/ExomeGermlineSingleSample_v3.0.0/pipelines/broad/dna_seq/germline/single_sample/exome/ExomeGermlineSingleSample.wdl',
      },
    ],
    last_run: {
      previously_run: false,
    },
  },
  {
    name: 'Covid-19 tutorial workflows',
    description:
      'Complete a Covid-19 study tutorial to learn more about workflows in Terra. To learn more, read Covid-19 Surveillance tutorial guide or go to the featured workspace',
    methods: [
      {
        name: 'fetch_sra_to_bam',
        description:
          'Retrieve reads from the NCBI Short Read Archive in unaligned BAM format with relevant metadata encoded.',
        source: 'GitHub',
        method_versions: [
          {
            name: 'v2.1.33.16',
            url: 'https://raw.githubusercontent.com/broadinstitute/viral-pipelines/v2.1.33.16/pipes/WDL/workflows/fetch_sra_to_bam.wdl',
          },
        ],
        last_run: {
          previously_run: false,
        },
        template: {
          method_input_mappings: [
            {
              input_name: 'fetch_sra_to_bam.Fetch_SRA_to_BAM.SRA_ID',
              input_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              source: {
                type: 'record_lookup',
                record_attribute: 'sra_id',
              },
            },
            {
              input_name: 'fetch_sra_to_bam.Fetch_SRA_to_BAM.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'fetch_sra_to_bam.Fetch_SRA_to_BAM.machine_mem_gb',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
          ],
          method_output_mappings: [
            {
              output_name: 'fetch_sra_to_bam.sra_metadata',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'sra_metadata',
              },
            },
            {
              output_name: 'fetch_sra_to_bam.reads_ubam',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'reads_ubam',
              },
            },
            {
              output_name: 'fetch_sra_to_bam.biosample_accession',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'biosample_accession',
              },
            },
            {
              output_name: 'fetch_sra_to_bam.sample_geo_loc',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'sample_geo_loc',
              },
            },
            {
              output_name: 'fetch_sra_to_bam.sample_collection_date',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'sample_collection_date',
              },
            },
            {
              output_name: 'fetch_sra_to_bam.sequencing_center',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'sequencing_center',
              },
            },
            {
              output_name: 'fetch_sra_to_bam.sequencing_platform',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'sequencing_platform',
              },
            },
            {
              output_name: 'fetch_sra_to_bam.library_id',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'library_id',
              },
            },
            {
              output_name: 'fetch_sra_to_bam.run_date',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'run_date',
              },
            },
            {
              output_name: 'fetch_sra_to_bam.sample_collected_by',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'sample_collected_by',
              },
            },
            {
              output_name: 'fetch_sra_to_bam.sample_strain',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'sample_strain',
              },
            },
            {
              output_name: 'fetch_sra_to_bam.sequencing_platform_model',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'sequencing_platform_model',
              },
            },
          ],
        },
      },
      {
        name: 'assemble_refbased',
        description:
          'Reference-based microbial consensus calling. Aligns NGS reads to a singular reference genome, calls a new consensus sequence, and emits: new assembly, reads aligned to provided reference, reads aligned to new assembly, various figures of merit, plots, and QC metrics. The user may provide unaligned reads spread across multiple input files and this workflow will parallelize alignment per input file before merging results prior to consensus calling.',
        source: 'GitHub',
        method_versions: [
          {
            name: 'v2.1.33.16',
            url: 'https://raw.githubusercontent.com/broadinstitute/viral-pipelines/v2.1.33.16/pipes/WDL/workflows/assemble_refbased.wdl',
          },
        ],
        last_run: {
          previously_run: false,
        },
        template: {
          method_input_mappings: [
            {
              input_name: 'assemble_refbased.reads_unmapped_bams',
              input_type: {
                type: 'array',
                array_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
                non_empty: true,
              },
              source: {
                type: 'record_lookup',
                record_attribute: 'reads_ubam',
              },
            },
            {
              input_name: 'assemble_refbased.reference_fasta',
              input_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              source: {
                type: 'literal',
                parameter_value:
                  'https://lze033433beed5b4a6a47de6.blob.core.windows.net/sc-e3ac5af2-dc4f-42cc-9111-a6f37acfe21a/ref-sarscov2-NC_045512.2.fasta',
              },
            },
            {
              input_name: 'assemble_refbased.sample_name',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'record_lookup',
                record_attribute: 'sra_id',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.binning_summary_statistic',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.base_q_threshold',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.novocraft_license',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.alignment_metrics.max_amp_len',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.max_coverage_depth',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.trim_coords_bed',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.ivar_trim.primer_offset',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.align_to_self.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.plotYLimits',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.mapping_q_threshold',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.skip_mark_dupes',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.run_discordance.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.call_consensus.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.alignment_metrics.max_amplicons',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.mapping_q_threshold',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.read_length_threshold',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.binning_summary_statistic',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.alignment_metrics.machine_mem_gb',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.plot_pixels_per_inch',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.call_consensus.mark_duplicates',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.plotYLimits',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.plot_only_non_duplicates',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.merge_align_to_self.reheader_table',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.plot_height_pixels',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.ivar_trim.machine_mem_gb',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.call_consensus.machine_mem_gb',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.align_to_self.machine_mem_gb',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.plotXLimits',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.major_cutoff',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Float',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.skip_mark_dupes',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.alignment_metrics.amplicon_set',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.aligner',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.merge_align_to_self.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.plot_width_pixels',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.align_to_ref.sample_name',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.bin_large_plots',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.merge_align_to_ref.reheader_table',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.ivar_trim.sliding_window',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.ivar_trim.min_quality',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.min_coverage',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.max_coverage_depth',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.plot_width_pixels',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.plotXLimits',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.base_q_threshold',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.merge_align_to_ref.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.alignment_metrics.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.align_to_ref.machine_mem_gb',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.bin_large_plots',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.isnvs_self.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.plot_only_non_duplicates',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.isnvs_self.out_basename',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.ivar_trim.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.skip_mark_dupes',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.align_to_self.sample_name',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.plot_pixels_per_inch',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_ref_coverage.plot_height_pixels',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.isnvs_ref.out_basename',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.isnvs_ref.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.ivar_trim.min_keep_length',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.plot_self_coverage.read_length_threshold',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'assemble_refbased.align_to_ref.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
          ],
          method_output_mappings: [
            {
              output_name: 'assemble_refbased.align_to_ref_fastqc',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_isnvs_vcf',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_merged_aligned_trimmed_only_bam',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_ref_merged_aligned_trimmed_only_bam',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_merged_bases_aligned',
              output_type: {
                type: 'primitive',
                primitive_type: 'Float',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_ref_merged_bases_aligned',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_merged_coverage_plot',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_ref_merged_coverage_plot',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_merged_coverage_tsv',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_ref_merged_coverage_tsv',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_merged_read_pairs_aligned',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_ref_merged_read_pairs_aligned',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_merged_reads_aligned',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_ref_merged_reads_aligned',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_per_input_aligned_flagstat',
              output_type: {
                type: 'array',
                array_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
                non_empty: false,
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_ref_per_input_aligned_flagstat',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_per_input_reads_aligned',
              output_type: {
                type: 'array',
                array_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
                non_empty: false,
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_ref_per_input_reads_aligned',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_per_input_reads_provided',
              output_type: {
                type: 'array',
                array_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
                non_empty: false,
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_ref_per_input_reads_provided',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_variants_vcf_gz',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_ref_variants_vcf_gz',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_ref_viral_core_version',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_ref_viral_core_version',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_self_merged_aligned_and_unaligned_bam',
              output_type: {
                type: 'array',
                array_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
                non_empty: false,
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_self_isnvs_vcf',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_self_merged_aligned_only_bam',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_self_merged_aligned_only_bam',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_self_merged_bases_aligned',
              output_type: {
                type: 'primitive',
                primitive_type: 'Float',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_self_merged_bases_aligned',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_self_merged_coverage_plot',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_self_merged_coverage_plot',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_self_merged_coverage_tsv',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_self_merged_coverage_tsv',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_self_merged_mean_coverage',
              output_type: {
                type: 'primitive',
                primitive_type: 'Float',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_self_merged_mean_coverage',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_self_merged_read_pairs_aligned',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_self_merged_read_pairs_aligned',
              },
            },
            {
              output_name: 'assemble_refbased.align_to_self_merged_reads_aligned',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'align_to_self_merged_reads_aligned',
              },
            },
            {
              output_name: 'assemble_refbased.assembly_fasta',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'assembly_fasta',
              },
            },
            {
              output_name: 'assemble_refbased.assembly_length',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'assembly_length',
              },
            },
            {
              output_name: 'assemble_refbased.assembly_length_unambiguous',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'assembly_length_unambiguous',
              },
            },
            {
              output_name: 'assemble_refbased.assembly_mean_coverage',
              output_type: {
                type: 'primitive',
                primitive_type: 'Float',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'assembly_mean_coverage',
              },
            },
            {
              output_name: 'assemble_refbased.assembly_method',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.dist_to_ref_indels',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'dist_to_ref_indels',
              },
            },
            {
              output_name: 'assemble_refbased.dist_to_ref_snps',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'dist_to_ref_snps',
              },
            },
            {
              output_name: 'assemble_refbased.ivar_trim_stats',
              output_type: {
                type: 'array',
                array_type: {
                  type: 'map',
                  key_type: 'String',
                  value_type: {
                    type: 'primitive',
                    primitive_type: 'String',
                  },
                },
                non_empty: false,
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.ivar_trim_stats_tsv',
              output_type: {
                type: 'array',
                array_type: {
                  type: 'array',
                  array_type: {
                    type: 'primitive',
                    primitive_type: 'String',
                  },
                  non_empty: false,
                },
                non_empty: false,
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.ivar_version',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'ivar_version',
              },
            },
            {
              output_name: 'assemble_refbased.num_libraries',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'num_libraries',
              },
            },
            {
              output_name: 'assemble_refbased.num_read_groups',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'num_read_groups',
              },
            },
            {
              output_name: 'assemble_refbased.picard_metrics_alignment',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.picard_metrics_insert_size',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.picard_metrics_wgs',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.primer_trimmed_read_count',
              output_type: {
                type: 'array',
                array_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
                non_empty: false,
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.primer_trimmed_read_percent',
              output_type: {
                type: 'array',
                array_type: {
                  type: 'primitive',
                  primitive_type: 'Float',
                },
                non_empty: false,
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.reference_genome_length',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'reference_genome_length',
              },
            },
            {
              output_name: 'assemble_refbased.replicate_concordant_sites',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'replicate_concordant_sites',
              },
            },
            {
              output_name: 'assemble_refbased.replicate_discordant_indels',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'replicate_discordant_indels',
              },
            },
            {
              output_name: 'assemble_refbased.replicate_discordant_snps',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'replicate_discordant_snps',
              },
            },
            {
              output_name: 'assemble_refbased.replicate_discordant_vcf',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'replicate_discordant_vcf',
              },
            },
            {
              output_name: 'assemble_refbased.samtools_ampliconstats',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.samtools_ampliconstats_parsed',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'none',
              },
            },
            {
              output_name: 'assemble_refbased.viral_assemble_version',
              output_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'viral_assemble_version',
              },
            },
          ],
        },
      },
      {
        name: 'sarscov2_nextstrain',
        description:
          'Align assemblies, build trees, and convert to json representation suitable for Nextstrain visualization. See https://nextstrain.org/docs/getting-started/ and https://nextstrain-augur.readthedocs.io/en/stable/',
        source: 'GitHub',
        method_versions: [
          {
            name: 'v2.1.33.16',
            url: 'https://raw.githubusercontent.com/broadinstitute/viral-pipelines/v2.1.33.16/pipes/WDL/workflows/sarscov2_nextstrain.wdl',
          },
        ],
        last_run: {
          previously_run: false,
        },
        template: {
          method_input_mappings: [
            {
              input_name: 'sarscov2_nextstrain.build_name',
              input_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
              source: {
                type: 'record_lookup',
                record_attribute: 'build_name',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.builds_yaml',
              input_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              source: {
                type: 'record_lookup',
                record_attribute: 'builds_yaml',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.assembly_fastas',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'array',
                  array_type: {
                    type: 'optional',
                    optional_type: {
                      type: 'primitive',
                      primitive_type: 'File',
                    },
                  },
                  non_empty: false,
                },
              },
              source: {
                type: 'record_lookup',
                record_attribute: 'assembly_fastas',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_traits.confidence',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_traits.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_traits.machine_mem_gb',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_traits.sampling_bias_correction',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Float',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_traits.weights',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_tree.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_tree.infer_ambiguous',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_tree.inference',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_tree.keep_ambiguous',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_tree.keep_overhangs',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_tree.output_vcf',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_tree.vcf_reference',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.assign_clades_to_nodes.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.augur_mask_sites.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.augur_mask_sites.mask_bed',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.dedup_seqs.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.dedup_seqs.error_on_seq_diff',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.dedup_seqs.nextstrain_ncov_repo_commit',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.derived_cols.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.derived_cols.lab_highlight_loc',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.derived_cols.table_map',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'array',
                  array_type: {
                    type: 'optional',
                    optional_type: {
                      type: 'primitive',
                      primitive_type: 'File',
                    },
                  },
                  non_empty: false,
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.draft_augur_tree.cpus',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.draft_augur_tree.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.draft_augur_tree.exclude_sites',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.draft_augur_tree.method',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.draft_augur_tree.substitution_model',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.draft_augur_tree.tree_builder_args',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.draft_augur_tree.vcf_reference',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.export_auspice_json.color_by_metadata',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'array',
                  array_type: {
                    type: 'primitive',
                    primitive_type: 'String',
                  },
                  non_empty: false,
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.export_auspice_json.colors_tsv',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'record_lookup',
                record_attribute: 'colors_tsv',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.export_auspice_json.description_md',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.export_auspice_json.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.export_auspice_json.geo_resolutions',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'array',
                  array_type: {
                    type: 'primitive',
                    primitive_type: 'String',
                  },
                  non_empty: false,
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.export_auspice_json.include_root_sequence',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.export_auspice_json.machine_mem_gb',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.export_auspice_json.maintainers',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'array',
                  array_type: {
                    type: 'primitive',
                    primitive_type: 'String',
                  },
                  non_empty: false,
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.export_auspice_json.title',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.filter_sequences_by_length.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.mafft.batch_chunk_size',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.mafft.cpus',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.mafft.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.mafft.mem_size',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.mafft.remove_reference',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.mafft.threads_per_job',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.nextstrain_ncov_defaults.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.nextstrain_ncov_defaults.nextstrain_ncov_repo_commit',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.branch_length_inference',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.clock_filter_iqd',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.clock_rate',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Float',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.clock_std_dev',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Float',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.coalescent',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.covariance',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.date_confidence',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.date_inference',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.divergence_units',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.gen_per_year',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.keep_polytomies',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.keep_root',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.precision',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.refine_augur_tree.vcf_reference',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ancestral_traits_to_infer',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'array',
                  array_type: {
                    type: 'primitive',
                    primitive_type: 'String',
                  },
                  non_empty: false,
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.auspice_config',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'record_lookup',
                record_attribute: 'auspice_config_json',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.clades_tsv',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.lat_longs_tsv',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.min_unambig_genome',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.ref_fasta',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.sample_metadata_tsvs',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'array',
                  array_type: {
                    type: 'optional',
                    optional_type: {
                      type: 'primitive',
                      primitive_type: 'File',
                    },
                  },
                  non_empty: false,
                },
              },
              source: {
                type: 'record_lookup',
                record_attribute: 'metadata_tsv',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tree_root_seq_id',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.snp_sites.allow_wildcard_bases',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.snp_sites.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.subsample.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.subsample.drop_list',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.subsample.keep_list',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.subsample.machine_mem_gb',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.subsample.nextstrain_ncov_repo_commit',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.subsample.parameters_yaml',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tip_frequencies.censored',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tip_frequencies.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tip_frequencies.include_internal_nodes',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tip_frequencies.inertia',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Float',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tip_frequencies.machine_mem_gb',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tip_frequencies.max_date',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Float',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tip_frequencies.method',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tip_frequencies.minimal_frequency',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Float',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tip_frequencies.stiffness',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Float',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tip_frequencies.wide_bandwidth',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Float',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.translate_augur_tree.docker',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.translate_augur_tree.genes',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.translate_augur_tree.vcf_reference',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.translate_augur_tree.vcf_reference_output',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tsv_join.out_suffix',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'String',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.tsv_join.prefer_first',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Boolean',
                },
              },
              source: {
                type: 'none',
              },
            },
            {
              input_name: 'sarscov2_nextstrain.zcat.cpus',
              input_type: {
                type: 'optional',
                optional_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              source: {
                type: 'none',
              },
            },
          ],
          method_output_mappings: [
            {
              output_name: 'sarscov2_nextstrain.auspice_input_json',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'auspice_input_json',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.combined_assemblies',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'combined_assemblies',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.counts_by_group',
              output_type: {
                type: 'map',
                key_type: 'String',
                value_type: {
                  type: 'primitive',
                  primitive_type: 'Int',
                },
              },
              destination: {
                type: 'record_update',
                record_attribute: 'counts_by_group',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.keep_list',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'keep_list',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.masked_alignment',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'masked_alignment',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.metadata_merged',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'metadata_merged',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.ml_tree',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'ml_tree',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.multiple_alignment',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'multiple_alignment',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.node_data_jsons',
              output_type: {
                type: 'array',
                array_type: {
                  type: 'primitive',
                  primitive_type: 'File',
                },
                non_empty: false,
              },
              destination: {
                type: 'record_update',
                record_attribute: 'node_data_jsons',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.root_sequence_json',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'root_sequence_json',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.sequences_kept',
              output_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'sequences_kept',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.subsampled_sequences',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'subsampled_sequences',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.time_tree',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'time_tree',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.tip_frequencies_json',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'tip_frequencies_json',
              },
            },
            {
              output_name: 'sarscov2_nextstrain.unmasked_snps',
              output_type: {
                type: 'primitive',
                primitive_type: 'File',
              },
              destination: {
                type: 'record_update',
                record_attribute: 'unmasked_snps',
              },
            },
          ],
        },
      },
    ],
  },
] satisfies FeaturedWorkflow[];
