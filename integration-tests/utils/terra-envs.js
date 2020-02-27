module.exports = {
  local: {
    billingProject: 'general-dev-billing-account',
    testUrl: 'http://localhost:3000',
    workflowName: 'echo_to_file'
  },
  dev: {
    billingProject: 'general-dev-billing-account',
    testUrl: 'https://bvdp-saturn-dev.appspot.com',
    workflowName: 'echo_to_file'
  },
  alpha: {
    billingProject: 'broad-dsde-alpha-two',
    testUrl: 'https://bvdp-saturn-alpha.appspot.com',
    workflowName: 'echo_to_file'
  },
  perf: {
    billingProject: '???',
    testUrl: 'https://bvdp-saturn-perf.appspot.com',
    workflowName: 'echo_to_file'
  },
  staging: {
    billingProject: 'bartholomew',
    testUrl: 'https://bvdp-saturn-staging.appspot.com',
    workflowName: 'echo_to_file'
  }
}
