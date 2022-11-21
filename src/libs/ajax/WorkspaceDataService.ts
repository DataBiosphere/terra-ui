import _ from 'lodash/fp'
import { authOpts, fetchWDS, jsonBody } from 'src/libs/ajax/ajax-common'
import {
  RecordQueryResponse,
  RecordTypeSchema,
  SearchRequest,
  TsvUploadResponse
} from 'src/libs/ajax/data-table-providers/WdsDataTableProvider'


export const WorkspaceData = signal => ({
  getSchema: async (instanceId: string): Promise<RecordTypeSchema[]> => {
    const res = await fetchWDS(`${instanceId}/types/v0.2`, _.merge(authOpts(), { signal }))
    return res.json()
  },
  getRecords: async (instanceId: string, recordType: string, parameters: SearchRequest): Promise<RecordQueryResponse> => {
    const res = await fetchWDS(`${instanceId}/search/v0.2/${recordType}`,
      _.mergeAll([authOpts(), jsonBody(parameters), { signal, method: 'POST' }]))
    return res.json()
  },
  deleteTable: async (instanceId: string, recordType: string): Promise<Response> => {
    const res = await fetchWDS(`${instanceId}/types/v0.2/${recordType}`,
      _.mergeAll([authOpts(), { signal, method: 'DELETE' }]))
    return res
  },
  downloadTsv: async (instanceId: string, recordType: string): Promise<Blob> => {
    const res = await fetchWDS(`${instanceId}/tsv/v0.2/${recordType}`, _.merge(authOpts(), { signal }))
    const blob = await res.blob()
    return blob
  },
  uploadTsv: async (instanceId: string, recordType: string, file: File): Promise<TsvUploadResponse> => {
    const formData = new FormData()
    formData.set('records', file)
    const res = await fetchWDS(`${instanceId}/tsv/v0.2/${recordType}`, _.mergeAll([authOpts(), { body: formData, signal, method: 'POST' }]))
    return res.json()
  }
})
