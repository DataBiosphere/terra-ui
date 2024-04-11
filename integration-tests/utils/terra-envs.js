module.exports = {
  dev: {
    billingProject: 'saturn-integration-test-dev',
    billingProjectAzure: 'mnolting20231030_azBpDev-1',
    testUrl: 'https://bvdp-saturn-dev.appspot.com',
    workflowName: 'echo_to_file',
    /**
     * Snapshot imported in import-tdr-snapshot
     * https://jade.datarepo-dev.broadinstitute.org/snapshots/44108c93-f2e6-4d58-b700-425756d72db0
     * */
    tdrSnapshot: {
      id: '44108c93-f2e6-4d58-b700-425756d72db0',
      name: 'aj_group_constraint_test_dataset_1_snapshot_1',
      manifestUrl:
        'https://storage.googleapis.com/fixtures-for-tests/fixtures/public/tdr-snapshot/dev/aj_group_constraint_test_dataset_1_snapshot_1/manifest.json',
      tdrUrl: 'https://jade.datarepo-dev.broadinstitute.org',
      groupConstraint: 'aj-group-constraint-test',
    },
  },
  staging: {
    billingProject: 'saturn-integration-test-stage',
    billingProjectAzure: 'dsp-staging-testing-20230915',
    testUrl: 'https://bvdp-saturn-staging.appspot.com',
    workflowName: 'echo_to_file',
  },
};
