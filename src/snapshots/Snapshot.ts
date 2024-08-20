export interface Snapshot {
  managers: string[];
  name: string;
  createDate: string;
  documentation?: string;
  entityType: string;
  snapshotComment: string;
  snapshotId: string;
  namespace: string;
  payload: string;
  url: string;
  public: boolean | undefined;
  synopsis: string;
}
