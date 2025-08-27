// used by workflows-app:
export interface AttributeSchema {
  name: string;
  datatype: string;
  relatesTo?: string;
}
// used by workflows-app:
export interface RecordTypeSchema {
  name: string;
  count: number;
  attributes: AttributeSchema[];
  primaryKey: string;
}
// used by workflows-app:
export type RecordAttributes = Record<string, unknown>; // truly "unknown" here; the backend Java representation is Map<String, Object>
// used by workflows-app:
export interface RecordResponse {
  id: string;
  type: string;
  attributes: RecordAttributes;
}
