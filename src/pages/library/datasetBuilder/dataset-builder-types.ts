export type Cohort = DatasetBuilderType;

export type ConceptSet = DatasetBuilderType & {
  domain: string;
};

export interface DatasetBuilderType {
  name: string;
}
