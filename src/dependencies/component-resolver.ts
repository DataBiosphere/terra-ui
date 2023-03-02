import { createDependencyResolver, UnComposedKey } from 'src/dependencies/dependency-core'


type CommonComponentsExports = typeof import('src/components/common')

export type ComponentDependencies =
  UnComposedKey<CommonComponentsExports, 'ButtonPrimary'> &
  UnComposedKey<CommonComponentsExports, 'ButtonSecondary'>

export const componentDependencies = createDependencyResolver<ComponentDependencies>()
