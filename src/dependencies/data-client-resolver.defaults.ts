import { DataClientDependencies } from 'src/dependencies/data-client-resolver'
import { AzureStorage } from 'src/libs/ajax/AzureStorage'
import { GoogleStorage } from 'src/libs/ajax/GoogleStorage'


export const getDefaultDataClientDeps = (): DataClientDependencies => ({
  GoogleStorage,
  AzureStorage
})
