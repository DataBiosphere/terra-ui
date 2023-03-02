import { createDependencyResolver, UnComposedKey } from 'src/dependencies/dependency-core'


type GoogleStorageExports = typeof import('src/libs/ajax/GoogleStorage')
type AzureStorageExports = typeof import('src/libs/ajax/AzureStorage')

export type DataClientDependencies =
  UnComposedKey<GoogleStorageExports, 'GoogleStorage'> &
  UnComposedKey<AzureStorageExports, 'AzureStorage'>

export const dataClientDependencies = createDependencyResolver<DataClientDependencies>()
