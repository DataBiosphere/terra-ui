import IncrementalResponse from 'src/libs/ajax/incremental-response/IncrementalResponse'


export interface FileBrowserFile {
  path: string
  url: string
  size: number
  createdAt: number
  updatedAt: number
}

export interface FileBrowserDirectory {
  path: string
}

interface FileBrowserProvider {
  getDirectoriesInDirectory(path: string, options?: { signal?: AbortSignal }): Promise<IncrementalResponse<FileBrowserDirectory>>
  getFilesInDirectory(path: string, options?: { signal?: AbortSignal }): Promise<IncrementalResponse<FileBrowserFile>>
}

export default FileBrowserProvider
