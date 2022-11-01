import _ from 'lodash/fp'
import { authOpts, fetchWDS, jsonBody } from 'src/libs/ajax/ajax-common'
import { SearchRequest } from 'src/libs/ajax/data-table-providers/WDSDataTableProvider'


export const WorkspaceDataService = signal => ({
  getSchema: async (instanceId: string) => {
    const res = await fetchWDS(`${instanceId}/types/v0.2`, _.merge(authOpts(), { signal }))
    return res.json()
  },
  getRecords: async (instanceId: string, recordType: string, parameters: SearchRequest) => {
    const res = await fetchWDS(`${instanceId}/search/v0.2/${recordType}`,
      _.mergeAll([authOpts(), jsonBody(parameters), { signal, method: 'POST' }]))
    return res.json()
  },
  deleteTable: async (instanceId: string, recordType: string) => {
    const res = await fetchWDS(`${instanceId}/types/v0.2/${recordType}`,
      _.mergeAll([authOpts(), { signal, method: 'DELETE' }]))
    return res
  },
  downloadTsv: async (instanceId: string, recordType: string) => {
    const res = await fetchWDS(`${instanceId}/tsv/v0.2/${recordType}`, _.merge(authOpts(), { signal }))
    return res
  },
  uploadTsv: async (instanceId, recordType, file) => {
    const formData = new FormData()
    formData.set('records', file)
    const res = await fetchWDS(`${instanceId}/tsv/v0.2/${recordType}`, _.mergeAll([authOpts(), { body: formData, signal, method: 'POST' }]))
    return res
  }
})
