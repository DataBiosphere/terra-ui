module.exports = {
  local: {
    billingProject: 'general-dev-billing-account',
    testUrl: 'http://localhost:3000'
  },
  dev: {
    billingProject: 'general-dev-billing-account',
    testUrl: 'https://bvdp-saturn-dev.appspot.com'
  },
  alpha: {
    billingProject: 'broad-dsde-alpha-two',
    testUrl: 'https://bvdp-saturn-alpha.appspot.com'
  },
  perf: {
    billingProject: '???',
    testUrl: 'https://bvdp-saturn-perf.appspot.com'
  },
  staging: {
    billingProject: 'bartholomew',
    testUrl: 'https://bvdp-saturn-staging.appspot.com'
  }
}
