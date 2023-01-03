module.exports = {
  dev: {
    billingProject: 'saturn-integration-test-dev',
    snapshotColumnName: 'name',
    snapshotId: 'f90f5d7f-c507-4e56-abfc-b965a66023fb',
    snapshotTableName: 'tableA',
    testUrl: 'https://bvdp-saturn-dev.appspot.com',
    workflowName: 'echo_to_file'
  },
  alpha: {
    billingProject: 'saturn-integration-test-alpha',
    snapshotColumnName: 'VCF_File_Name',
    snapshotId: 'd56f4db5-b6c6-4a7e-8be2-ff6aa21c4fa6',
    snapshotTableName: 'vcf_file',
    testUrl: 'https://bvdp-saturn-alpha.appspot.com',
    workflowName: 'echo_to_file'
  },
  staging: {
    billingProject: 'saturn-integration-test-stage',
    snapshotColumnName: 'VCF_File_Name',
    snapshotId: 'a5624b5c-df41-4a02-8013-d3b6cd51b22a',
    snapshotTableName: 'vcf_file',
    testUrl: 'https://bvdp-saturn-staging.appspot.com',
    workflowName: 'echo_to_file'
  }
}
