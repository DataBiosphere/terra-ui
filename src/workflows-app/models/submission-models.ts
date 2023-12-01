export type PrimitiveInputType = {
  type: 'primitive';
  primitive_type: 'String' | 'Int' | 'Boolean' | 'Float' | 'File';
};

export type ArrayInputType = {
  type: 'array';
  non_empty: boolean;
  array_type: InputType;
};

export type MapInputType = {
  type: 'map';
  key_type: PrimitiveInputType['primitive_type'];
  value_type: InputType;
};

export type StructField = {
  field_name: string;
  field_type: InputType;
};

export type StructInputType = {
  type: 'struct';
  fields: StructField[];
};

export type OptionalInputType = {
  type: 'optional';
  optional_type: Exclude<InputType, OptionalInputType>;
};

export type InputType = PrimitiveInputType | ArrayInputType | MapInputType | StructInputType | OptionalInputType;
export type OutputType = Exclude<InputType, OptionalInputType>;

export type NoneInputSource = {
  type: 'none';
};

export type LiteralInputSource = {
  type: 'literal';
  parameter_value: any;
};

export type RecordLookupInputSource = {
  type: 'record_lookup';
  record_attribute: string;
};

export type RecordUpdateOutputDestination = {
  type: 'record_update';
  record_attribute: string;
};

export type ObjectBuilderField = {
  name: string;
  source: InputSource;
};

export type ObjectBuilderInputSource = {
  type: 'object_builder';
  fields: ObjectBuilderField[];
};

export type InputSource = NoneInputSource | LiteralInputSource | RecordLookupInputSource | ObjectBuilderInputSource;
export type OutputDestination = NoneInputSource | RecordUpdateOutputDestination;

export type InputDefinition = {
  input_name: string;
  input_type: InputType;
  source: InputSource;
};

export type StructInputDefinition = StructField & ObjectBuilderField;

export type WorkflowInputDefinition = InputDefinition | StructInputDefinition;

export type OutputDefinition = {
  output_name: string;
  output_type: OutputType;
  destination: OutputDestination;
};
