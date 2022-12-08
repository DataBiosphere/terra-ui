import _ from 'lodash/fp'
import {authOpts, fetchOk, fetchWDS, jsonBody} from 'src/libs/ajax/ajax-common'
import {
  RecordQueryResponse,
  RecordTypeSchema,
  SearchRequest,
  TsvUploadResponse
} from 'src/libs/ajax/data-table-providers/WdsDataTableProvider'

// TODO: AJ-745: Leo<>WDS instances are not auto-created yet. Post-this-ticket, instanceId = tempInstanceId can be removed
const tempInstanceId = '6e8f8d2a-f7ac-4927-9f86-7a43f8255735'

export const WorkspaceData = signal => ({
  getSchema: async (root: string, instanceId: string): Promise<RecordTypeSchema[]> => {
    instanceId = tempInstanceId;
    const res = await fetchWDS(root)(`${instanceId}/types/v0.2`, _.merge(authOpts(), { signal }))
    return res.json()
  },
  getRecords: async (root: string, instanceId: string, recordType: string, parameters: SearchRequest): Promise<RecordQueryResponse> => {
    instanceId = tempInstanceId;
    const res = await fetchWDS(root)(`${instanceId}/search/v0.2/${recordType}`,
      _.mergeAll([authOpts(), jsonBody(parameters), { signal, method: 'POST' }]))
    return res.json()
  },
  deleteTable: async (root: string, instanceId: string, recordType: string): Promise<Response> => {
    instanceId = tempInstanceId;
    const res = await fetchWDS(root)(`${instanceId}/types/v0.2/${recordType}`,
      _.mergeAll([authOpts(), { signal, method: 'DELETE' }]))
    return res
  },
  downloadTsv: async (root: string, instanceId: string, recordType: string): Promise<Blob> => {
    instanceId = tempInstanceId;
    const res = await fetchWDS(root)(`${instanceId}/tsv/v0.2/${recordType}`, _.merge(authOpts(), { signal }))
    const blob = await res.blob()
    return blob
  },
  uploadTsv: async (root: string, instanceId: string, recordType: string, file: File): Promise<TsvUploadResponse> => {
    const formData = new FormData()
    formData.set('records', file)
    instanceId = tempInstanceId;
    const res = await fetchWDS(root)(`${instanceId}/tsv/v0.2/${recordType}`, _.mergeAll([authOpts(), { body: formData, signal, method: 'POST' }]))
    return res.json()
  }
})
