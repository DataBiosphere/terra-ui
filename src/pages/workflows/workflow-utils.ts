/**
 * A method definition as defined by the schema used in the
 * Agora API.
 */
export interface MethodDefinition {
  namespace: string;
  name: string;
  synopsis: string;
  managers: string[];
  public: boolean;
  numConfigurations: number;
  numSnapshots: number;
  entityType: string;
}
