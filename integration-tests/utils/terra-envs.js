module.exports = {
  local: {
    billingProject: 'saturn-integration-test-dev',
    testUrl: 'http://localhost:3000',
    workflowName: 'echo_to_file'
  },
  dev: {
    billingProject: 'saturn-integration-test-dev',
    testUrl: 'https://bvdp-saturn-dev.appspot.com',
    workflowName: 'echo_to_file'
  },
  alpha: {
    billingProject: 'saturn-integration-test-alpha',
    testUrl: 'https://bvdp-saturn-alpha.appspot.com',
    workflowName: 'echo_to_file'
  },
  perf: {
    billingProject: 'saturn-integration-test-perf',
    testUrl: 'https://bvdp-saturn-perf.appspot.com',
    workflowName: 'echo_to_file'
  },
  staging: {
    billingProject: 'saturn-integration-test-stage',
    testUrl: 'https://bvdp-saturn-staging.appspot.com',
    workflowName: 'echo_to_file'
  }
}
