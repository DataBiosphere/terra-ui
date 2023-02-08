import _ from 'lodash/fp'
import * as qs from 'qs'
import { authOpts, fetchBillingProfileManager, fetchOrchestration, fetchRawls, jsonBody } from 'src/libs/ajax/ajax-common'


export const Billing = signal => ({
  listProjects: async () => {
    const res = await fetchRawls('billing/v2', _.merge(authOpts(), { signal }))
    return res.json()
  },

  getProject: async projectName => {
    const route = `billing/v2/${projectName}`
    const res = await fetchRawls(route, _.merge(authOpts(), { signal, method: 'GET' }))
    return res.json()
  },

  listAccounts: async () => {
    const res = await fetchRawls('user/billingAccounts?firecloudHasAccess=true', _.merge(authOpts(), { signal }))
    return res.json()
  },

  createGCPProject: async (projectName, billingAccount) => {
    return await fetchRawls('billing/v2',
      _.mergeAll([authOpts(), jsonBody({ projectName, billingAccount }), { signal, method: 'POST' }])
    )
  },

  createAzureProject: async (projectName, tenantId, subscriptionId, managedResourceGroupId, members) => {
    // members: an array of {email: string, role: string}
    return await fetchRawls('billing/v2',
      _.mergeAll([authOpts(), jsonBody(
        { projectName, managedAppCoordinates: { tenantId, subscriptionId, managedResourceGroupId }, members }
      ),
      { signal, method: 'POST' }])
    )
  },

  deleteProject: async projectName => {
    const route = `billing/v2/${projectName}`
    const res = await fetchRawls(route, _.merge(authOpts(), { signal, method: 'DELETE' }))
    return res
  },

  changeBillingAccount: async ({ billingProjectName, newBillingAccountName }) => {
    const res = await fetchOrchestration(`api/billing/v2/${billingProjectName}/billingAccount`,
      _.mergeAll([
        authOpts(), { signal, method: 'PUT' },
        jsonBody({ billingAccount: newBillingAccountName })
      ]))
    return res
  },

  removeBillingAccount: async ({ billingProjectName }) => {
    const res = await fetchOrchestration(`api/billing/v2/${billingProjectName}/billingAccount`,
      _.merge(authOpts(), { signal, method: 'DELETE' }))
    return res
  },

  updateSpendConfiguration: async ({ billingProjectName, datasetGoogleProject, datasetName }) => {
    const res = await fetchOrchestration(`api/billing/v2/${billingProjectName}/spendReportConfiguration`,
      _.mergeAll([
        authOpts(), { signal, method: 'PUT' },
        jsonBody({ datasetGoogleProject, datasetName })
      ]))
    return res
  },

  /**
   * Returns the spend report for the given billing project, from 12 AM on the startDate to 11:59 PM on the endDate (UTC). Spend details by
   * Workspace are included.
   *
   * @param billingProjectName
   * @param startDate, a string of the format YYYY-MM-DD, representing the start date of the report.
   * @param endDate a string of the format YYYY-MM-DD, representing the end date of the report.
   * @returns {Promise<*>}
   */
  getSpendReport: async ({ billingProjectName, startDate, endDate }) => {
    const res = await fetchRawls(
      `billing/v2/${billingProjectName}/spendReport?${qs.stringify({ startDate, endDate, aggregationKey: 'Workspace~Category' })}&${qs.stringify({ aggregationKey: 'Category' })}`,
      _.merge(authOpts(), { signal })
    )
    return res.json()
  },

  listProjectUsers: async projectName => {
    const res = await fetchRawls(`billing/v2/${projectName}/members`, _.merge(authOpts(), { signal }))
    return res.json()
  },

  addProjectUser: (projectName, roles, email) => {
    const addRole = role => fetchRawls(
      `billing/v2/${projectName}/members/${role}/${encodeURIComponent(email)}`,
      _.merge(authOpts(), { signal, method: 'PUT' })
    )

    return Promise.all(_.map(addRole, roles))
  },

  removeProjectUser: (projectName, roles, email) => {
    const removeRole = role => fetchRawls(
      `billing/v2/${projectName}/members/${role}/${encodeURIComponent(email)}`,
      _.merge(authOpts(), { signal, method: 'DELETE' })
    )

    return Promise.all(_.map(removeRole, roles))
  },

  changeUserRoles: async (projectName, email, oldRoles, newRoles) => {
    const billing = Billing()
    if (!_.isEqual(oldRoles, newRoles)) {
      await billing.addProjectUser(projectName, _.difference(newRoles, oldRoles), email)
      return billing.removeProjectUser(projectName, _.difference(oldRoles, newRoles), email)
    }
  },

  listAzureManagedApplications: async (subscriptionId, includeAssignedApplications) => {
    const response = await fetchBillingProfileManager(
      `azure/v1/managedApps?azureSubscriptionId=${subscriptionId}&includeAssignedApplications=${includeAssignedApplications}`,
      _.merge(authOpts(), { signal }))
    return response.json()
  }
})

export const canUseWorkspaceProject = async ({ canCompute, workspace: { namespace } }) => {
  return canCompute || _.some(
    ({ projectName, roles }) => projectName === namespace && _.includes('Owner', roles),
    await Billing().listProjects()
  )
}
