import _ from 'lodash/fp'
import { authOpts, fetchOk, jsonBody } from 'src/libs/ajax/ajax-common'
import {
  RecordQueryResponse,
  RecordTypeSchema,
  SearchRequest,
  TsvUploadResponse
} from 'src/libs/ajax/data-table-providers/WdsDataTableProvider'


export const WorkspaceData = signal => ({
  getSchema: async (instanceId: string, root: string): Promise<RecordTypeSchema[]> => {
    // const res = await fetchWDS(root)(`${instanceId}/types/v0.2`, _.merge(authOpts(), { signal }))
    const res = await fetchOk(`${root}/${instanceId}/types/v0.2`, _.merge(authOpts(), { signal }))
    return res.json()
  },
  getRecords: async (root: string, instanceId: string, recordType: string, parameters: SearchRequest): Promise<RecordQueryResponse> => {
    // const res = await fetchWDS("www.temp.com")(`${instanceId}/search/v0.2/${recordType}`,
    const res = await fetchOk(`${root}/${instanceId}/search/v0.2/${recordType}`,
      _.mergeAll([authOpts(), jsonBody(parameters), { signal, method: 'POST' }]))
    return res.json()
  },
  deleteTable: async (root: string, instanceId: string, recordType: string): Promise<Response> => {
    // const res = await fetchWDS("www.temp.com")(`${instanceId}/types/v0.2/${recordType}`,
    const res = await fetchOk(`${root}/${instanceId}/types/v0.2/${recordType}`,
      _.mergeAll([authOpts(), { signal, method: 'DELETE' }]))
    return res
  },
  downloadTsv: async (root: string, instanceId: string, recordType: string): Promise<Blob> => {
    // const res = await fetchWDS("www.temp.com")(`${instanceId}/tsv/v0.2/${recordType}`, _.merge(authOpts(), { signal }))
    const res = await fetchOk(`${root}/${instanceId}/tsv/v0.2/${recordType}`, _.merge(authOpts(), { signal }))
    const blob = await res.blob()
    return blob
  },
  uploadTsv: async (root: string, instanceId: string, recordType: string, file: File): Promise<TsvUploadResponse> => {
    const formData = new FormData()
    formData.set('records', file)
    // const res = await fetchWDS("www.temp.com")(`${instanceId}/tsv/v0.2/${recordType}`, _.mergeAll([authOpts(), { body: formData, signal, method: 'POST' }]))
    const res = await fetchOk(`${root}/${instanceId}/tsv/v0.2/${recordType}`, _.mergeAll([authOpts(), { body: formData, signal, method: 'POST' }]))
    return res.json()
  }
})
