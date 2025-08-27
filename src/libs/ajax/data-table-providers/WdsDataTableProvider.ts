// used by workflows-app:
export interface AttributeSchema {
  name: string;
  datatype: string;
  relatesTo?: string;
}

export interface RecordTypeSchema {
  name: string;
  count: number;
  attributes: AttributeSchema[];
  primaryKey: string;
}

export type RecordAttributes = Record<string, unknown>; // truly "unknown" here; the backend Java representation is Map<String, Object>

export interface RecordResponse {
  id: string;
  type: string;
  attributes: RecordAttributes;
}
