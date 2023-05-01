export default {
  b37Human: {
    axiomPoly_resource_vcf: 'gs://gcp-public-data--broad-references/hg19/v0/Axiom_Exome_Plus.genotypes.all_populations.poly.vcf.gz',
    ref_fasta: 'gs://gcp-public-data--broad-references/hg19/v0/Homo_sapiens_assembly19.fasta',
    ref_dict: 'gs://gcp-public-data--broad-references/hg19/v0/Homo_sapiens_assembly19.dict',
    unpadded_intervals_file: 'gs://gatk-test-data/intervals/wgs_calling_regions.v1.list',
    one_thousand_genomes_resource_vcf_index: 'gs://gcp-public-data--broad-references/hg19/v0/1000G_phase1.snps.high_confidence.b37.vcf.gz.tbi',
    ref_alt: 'gs://gcp-public-data--broad-references/hg19/v0/Homo_sapiens_assembly19.fasta.alt',
    dbsnp_vcf: 'gs://gcp-public-data--broad-references/hg19/v0/dbsnp_138.b37.vcf.gz',
    ref_ann: 'gs://gcp-public-data--broad-references/hg19/v0/Homo_sapiens_assembly19.fasta.64.ann',
    ref_name: 'b37',
    omni_resource_vcf: 'gs://gcp-public-data--broad-references/hg19/v0/1000G_omni2.5.b37.vcf.gz',
    known_indels_sites_indices: [
      'gs://gcp-public-data--broad-references/hg19/v0/Mills_and_1000G_gold_standard.indels.b37.vcf.gz.tbi',
      'gs://gcp-public-data--broad-references/hg19/v0/Homo_sapiens_assembly19.known_indels_20120518.vcf.idx',
    ],
    one_thousand_genomes_resource_vcf: 'gs://gcp-public-data--broad-references/hg19/v0/1000G_phase1.snps.high_confidence.b37.vcf.gz',
    hapmap_resource_vcf: 'gs://gcp-public-data--broad-references/hg19/v0/hapmap_3.3.b37.vcf.gz',
    scattered_calling_intervals_list: 'gs://gatk-test-data/intervals/b37_wgs_scattered_calling_intervals.txt',
    ref_sa: 'gs://gcp-public-data--broad-references/hg19/v0/Homo_sapiens_assembly19.fasta.64.sa',
    mills_resource_vcf: 'gs://gcp-public-data--broad-references/hg19/v0/Mills_and_1000G_gold_standard.indels.b37.sites.vcf',
    ref_amb: 'gs://gcp-public-data--broad-references/hg19/v0/Homo_sapiens_assembly19.fasta.64.amb',
    eval_interval_list: 'gs://gcp-public-data--broad-references/hg19/v0/wgs_evaluation_regions.v1.interval_list',
    axiomPoly_resource_vcf_index: 'gs://gcp-public-data--broad-references/hg19/v0/Axiom_Exome_Plus.genotypes.all_populations.poly.vcf.gz.tbi',
    ref_bwt: 'gs://gcp-public-data--broad-references/hg19/v0/Homo_sapiens_assembly19.fasta.64.bwt',
    ref_fasta_index: 'gs://gcp-public-data--broad-references/hg19/v0/Homo_sapiens_assembly19.fasta.fai',
    dbsnp_vcf_index: 'gs://gcp-public-data--broad-references/hg19/v0/dbsnp_138.b37.vcf.gz.tbi',
    omni_resource_vcf_index: 'gs://gcp-public-data--broad-references/hg19/v0/1000G_omni2.5.b37.vcf.gz.tbi',
    known_indels_sites_VCFs: [
      'gs://gcp-public-data--broad-references/hg19/v0/Mills_and_1000G_gold_standard.indels.b37.vcf.gz',
      'gs://gcp-public-data--broad-references/hg19/v0/Homo_sapiens_assembly19.known_indels_20120518.vcf',
    ],
    hapmap_resource_vcf_index: 'gs://gcp-public-data--broad-references/hg19/v0/hapmap_3.3.b37.vcf.gz.tbi',
    mills_resource_vcf_index: 'gs://gcp-public-data--broad-references/hg19/v0/Mills_and_1000G_gold_standard.indels.b37.sites.vcf.idx',
    ref_pac: 'gs://gcp-public-data--broad-references/hg19/v0/Homo_sapiens_assembly19.fasta.64.pac',
  },
  hg38: {
    axiomPoly_resource_vcf: 'gs://gcp-public-data--broad-references/hg38/v0/Axiom_Exome_Plus.genotypes.all_populations.poly.hg38.vcf.gz',
    ref_fasta: 'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.fasta',
    call_interval_list: 'gs://gcp-public-data--broad-references/hg38/v0/wgs_calling_regions.hg38.interval_list',
    ref_dict: 'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.dict',
    unpadded_intervals_file: 'gs://gatk-test-data/intervals/hg38.even.handcurated.20k.intervals',
    one_thousand_genomes_resource_vcf_index: 'gs://gcp-public-data--broad-references/hg38/v0/1000G_phase1.snps.high_confidence.hg38.vcf.gz.tbi',
    ref_alt: 'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.fasta.64.alt',
    dbsnp_vcf: 'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.dbsnp138.vcf',
    ref_ann: 'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.fasta.64.ann',
    omni_resource_vcf: 'gs://gcp-public-data--broad-references/hg38/v0/1000G_omni2.5.hg38.vcf.gz',
    known_indels_sites_indices: [
      'gs://gcp-public-data--broad-references/hg38/v0/Mills_and_1000G_gold_standard.indels.hg38.vcf.gz.tbi',
      'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.known_indels.vcf.gz.tbi',
    ],
    one_thousand_genomes_resource_vcf: 'gs://gcp-public-data--broad-references/hg38/v0/1000G_phase1.snps.high_confidence.hg38.vcf.gz',
    hapmap_resource_vcf: 'gs://gcp-public-data--broad-references/hg38/v0/hapmap_3.3.hg38.vcf.gz',
    scattered_calling_intervals_list: 'gs://gatk-test-data/intervals/hg38_wgs_scattered_calling_intervals.txt',
    ref_sa: 'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.fasta.64.sa',
    mills_resource_vcf: 'gs://gcp-public-data--broad-references/hg38/v0/Mills_and_1000G_gold_standard.indels.hg38.vcf.gz',
    ref_amb: 'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.fasta.64.amb',
    eval_interval_list: 'gs://gcp-public-data--broad-references/hg38/v0/wgs_evaluation_regions.hg38.interval_list',
    axiomPoly_resource_vcf_index: 'gs://gcp-public-data--broad-references/hg38/v0/Axiom_Exome_Plus.genotypes.all_populations.poly.hg38.vcf.gz.tbi',
    ref_bwt: 'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.fasta.64.bwt',
    ref_fasta_index: 'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.fasta.fai',
    dbsnp_vcf_index: 'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.dbsnp138.vcf.idx',
    omni_resource_vcf_index: 'gs://gcp-public-data--broad-references/hg38/v0/1000G_omni2.5.hg38.vcf.gz.tbi',
    known_indels_sites_VCFs: [
      'gs://gcp-public-data--broad-references/hg38/v0/Mills_and_1000G_gold_standard.indels.hg38.vcf.gz',
      'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.known_indels.vcf.gz',
    ],
    hapmap_resource_vcf_index: 'gs://gcp-public-data--broad-references/hg38/v0/hapmap_3.3.hg38.vcf.gz.tbi',
    mills_resource_vcf_index: 'gs://gcp-public-data--broad-references/hg38/v0/Mills_and_1000G_gold_standard.indels.hg38.vcf.gz.tbi',
    ref_pac: 'gs://gcp-public-data--broad-references/hg38/v0/Homo_sapiens_assembly38.fasta.64.pac',
  },
  'Mmul-10': {
    ref_fasta: 'gs://gcp-public-data--broad-references/M.mulatta/Mmul_10/GCF_003339765.1_Mmul_10_genomic.fna',
  },
  'Clint-PTRv2': {
    ref_fasta: 'gs://gcp-public-data--broad-references/P.troglodytes/Clint_PTRv2/GCF_002880755.1_Clint_PTRv2_genomic.fna',
  },
  GRCm39: {
    ref_fasta: 'gs://gcp-public-data--broad-references/GRCm39/GCF_000001635.27_GRCm39_genomic.fna',
  },
  'mRatBN7-2': {
    ref_fasta: 'gs://gcp-public-data--broad-references/R.norvegicus/mRatBN7.2/GCF_015227675.2_mRatBN7.2_genomic.fna',
  },
  'Rnor-6-0': {
    ref_fasta: 'gs://gcp-public-data--broad-references/R.norvegicus/Rnor_6.0/GCA_000001895.4_Rnor_6.0_genomic.fna',
  },
  'Release-6-plus-ISO1-MT': {
    ref_fasta: 'gs://gcp-public-data--broad-references/D.melanogaster/Release_6_plus_ISO1_MT/GCF_000001215.4_Release_6_plus_ISO1_MT_genomic.fna',
  },
  'UCB-Xtro-10-0': {
    ref_fasta: 'gs://gcp-public-data--broad-references/X.tropicalis/UCB_Xtro_10.0/GCF_000004195.4_UCB_Xtro_10.0_genomic.fna',
  },
  GRCz11: {
    ref_fasta: 'gs://gcp-public-data--broad-references/D.rerio/GRCz11/GCF_000002035.6_GRCz11_genomic.fna',
  },
  WBcel235: {
    ref_fasta: 'gs://gcp-public-data--broad-references/C.elegans/WBcel235/GCF_000002985.6_WBcel235_genomic.fna',
  },
  R64: {
    ref_fasta: 'gs://gcp-public-data--broad-references/S.cerevisiae/R64/GCF_000146045.2_R64_genomic.fna',
  },
  'ROS-Cfam-1-0': {
    ref_fasta: 'gs://gcp-public-data--broad-references/C.lupus_familiaris/ROS_Cfam_1.0/GCF_014441545.1_ROS_Cfam_1.0_genomic.fna',
  },
  'UU-Cfam-GSD-1-0': {
    ref_fasta: 'gs://gcp-public-data--broad-references/C.lupus_familiaris/UU_Cfam_GSD_1.0/GCA_011100685.1_UU_Cfam_GSD_1.0_genomic.fna',
  },
  'Sscrofa11-1': {
    ref_fasta: 'gs://gcp-public-data--broad-references/S.scrofa/Sscrofa11.1/GCF_000003025.6_Sscrofa11.1_genomic.fna',
  },
  'ARS-UI-Ramb-v2-0': {
    ref_fasta: 'gs://gcp-public-data--broad-references/O.aries/ARS-UI_Ramb_v2.0/GCF_016772045.1_ARS-UI_Ramb_v2.0_genomic.fna',
  },
};
