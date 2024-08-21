/**
 * Type for Rawls's MethodRepoMethod schema.
 *
 * Note: Some properties that are optional here are marked as required in the
 * schema, but the Rawls API does not always include them in its responses.
 */
export interface MethodRepoMethod {
  methodNamespace?: string;
  methodName?: string;
  methodVersion: number;
  methodPath?: string;
  sourceRepo?: string;
  methodUri?: string;
}

/**
 * Type for Rawls's MethodConfiguration schema.
 *
 * Note: Some properties that are optional here are marked as required in the
 * schema, but the Rawls API does not always include them in its responses.
 */
export interface MethodConfiguration {
  namespace: string;
  name: string;
  rootEntityType?: string;
  inputs?: any;
  outputs?: any;
  methodRepoMethod: MethodRepoMethod;
  methodConfigVersion?: number;
  deleted?: boolean;
  dataReferenceName?: string;
}
