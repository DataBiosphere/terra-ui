import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { ensureBillingScope } from 'src/libs/auth'


export const listProjectsWithAccounts = async () => {
  const { Billing, GoogleBilling } = Ajax()

  await ensureBillingScope()

  const accountNames = _.map('accountName', await Billing.listAccounts()) // or fetch account names from FireCloud
  const projectNames = await Promise.all(_.map(async accountName => {
    try {
      return await GoogleBilling.listProjectNames(accountName)
    } catch (errorResponse) {
      // This might happen if the user has permission to create projects with this account
      // but is missing the billing.resourceAssociations.list permission.
      if (errorResponse.status === 403) {
        return []
      } else {
        throw errorResponse
      }
    }
  }, accountNames))
  return _.fromPairs(_.zip(accountNames, projectNames))
}
