import { Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Dispatch, SetStateAction, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { ButtonPrimary, Link } from 'src/components/common';
import { HeaderCell, SimpleFlexTable, TextCell } from 'src/components/table';
import { AttributeSchema } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import * as Utils from 'src/libs/utils';
import { WorkflowTableColumnNames } from 'src/libs/workflow-utils';
import {
  InputsButtonRow,
  InputSourceSelect,
  ParameterValueTextInput,
  RecordLookupSelect,
  StructBuilderLink,
  WithWarnings,
} from 'src/workflows-app/components/inputs-common';
import {
  ObjectBuilderInputSource,
  StructInputDefinition,
  StructInputType,
} from 'src/workflows-app/models/submission-models';
import {
  asStructType,
  inputTypeStyle,
  isInputOptional,
  renderTypeText,
  typeMatch,
  validateInputs,
} from 'src/workflows-app/utils/submission-utils';

const buildStructTypePath = (indexPath) =>
  _.join(
    '.',
    _.map((row) => `fields.${row}.field_type`, indexPath)
  );
const buildStructSourcePath = (indexPath) =>
  _.join(
    '.',
    _.map((row) => `fields.${row}.source`, indexPath)
  );
const buildStructTypeNamePath = (indexPath) =>
  _.replace(/\.field_type$/, '.field_name', buildStructTypePath(indexPath));
const buildStructSourceNamePath = (indexPath) => _.replace(/\.source$/, '.name', buildStructSourcePath(indexPath));

export const buildStructBreadcrumbs = (indexPath: number[], structType: StructInputType): string[] =>
  _.map(
    // map slices of the indexPath (e.g. [0, 1, 2] -> [0], [0, 1], [0, 1, 2])
    // onto their corresponding field_names within structType, via buildStructTypeNamePath
    (end) => _.get(buildStructTypeNamePath(_.slice(0, end + 1, indexPath)), structType),
    _.range(0, indexPath.length)
  );

type StructBuilderProps = {
  structName: string;
  structType: StructInputType;
  structSource: ObjectBuilderInputSource;
  setStructSource: Dispatch<SetStateAction<ObjectBuilderInputSource>>;
  dataTableAttributes: Record<string, AttributeSchema>;
  structIndexPath: number[];
  setStructIndexPath: Dispatch<SetStateAction<number[]>>;
};

export const StructBuilder = (props: StructBuilderProps) => {
  const {
    structName,
    structType,
    structSource,
    setStructSource,
    dataTableAttributes,
    structIndexPath,
    setStructIndexPath,
  } = props;

  const [includeOptionalInputs, setIncludeOptionalInputs] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [prevStructIndex, setPrevStructIndex] = useState(structIndexPath);

  if (structIndexPath !== prevStructIndex) {
    setSearchFilter('');
    setIncludeOptionalInputs(true);
    setPrevStructIndex(structIndexPath);
  }

  const structTypePath = buildStructTypePath(structIndexPath);
  const structSourcePath = buildStructSourcePath(structIndexPath);
  const structTypeNamePath = buildStructTypeNamePath(structIndexPath);

  const currentStructType = structTypePath ? asStructType(_.get(structTypePath, structType)) : structType;
  const currentStructSource = structSourcePath
    ? (_.get(structSourcePath, structSource) as ObjectBuilderInputSource)
    : structSource;
  const currentStructName = structTypeNamePath ? (_.get(structTypeNamePath, structType) as string) : structName;

  const setCurrentStructSource = structSourcePath
    ? (source) => setStructSource(_.set(structSourcePath, source, structSource))
    : setStructSource;

  const structInputDefinition = _.zip(currentStructSource.fields, currentStructType.fields)
    .map(([source, type]) => _.merge(source, type))
    .filter((merged): merged is StructInputDefinition => merged !== undefined);
  const currentStructBreadcrumbs = buildStructBreadcrumbs(structIndexPath, structType);

  const inputValidations = validateInputs(structInputDefinition, dataTableAttributes);

  const inputTableData = _.orderBy(
    [({ field_name: name }) => name.toLowerCase()],
    ['asc'],
    structInputDefinition
      .map((row, index) => ({
        ...row,
        inputTypeStr: renderTypeText(row.field_type),
        configurationIndex: index,
        optional: isInputOptional(row.field_type),
      }))
      .filter(
        ({ optional, field_name: name }) =>
          (includeOptionalInputs || !optional) && name.toLowerCase().includes(searchFilter.toLowerCase())
      )
  );

  const breadcrumbsHeight = 35;
  return div({ style: { height: 500 }, role: 'struct-builder' }, [
    div(
      {
        'aria-label': 'struct-breadcrumbs',
        style: {
          height: breadcrumbsHeight,
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
        },
      },
      [
        h(TextCell, {}, [
          ...[structName, ...currentStructBreadcrumbs].slice(0, -1).map((name, i) =>
            h(
              Link,
              {
                onClick: () => setStructIndexPath(structIndexPath.slice(0, i)),
              },
              [`${name} / `]
            )
          ),
          currentStructName,
        ]),
      ]
    ),
    h(InputsButtonRow, {
      optionalButtonProps: {
        includeOptionalInputs,
        setIncludeOptionalInputs,
      },
      searchProps: {
        searchFilter,
        setSearchFilter,
      },
    }),
    div({ style: { height: `calc(500px - ${breadcrumbsHeight}px - 2.5rem)` } }, [
      h(AutoSizer, [
        ({ width, height }) => {
          return div({ style: { overflow: 'scroll', height, width } }, [
            h(SimpleFlexTable, {
              'aria-label': 'struct-table',
              rowCount: inputTableData.length,
              readOnly: false,
              hoverHighlight: false,
              noContentMessage: '',
              columns: [
                {
                  size: { basis: 250, grow: 0 },
                  field: 'struct',
                  headerRenderer: () => h(HeaderCell, ['Struct']),
                  cellRenderer: () => {
                    return h(TextCell, { style: { fontWeight: 500 } }, [currentStructName]);
                  },
                },
                {
                  size: { basis: 160, grow: 0 },
                  field: 'field',
                  headerRenderer: () => h(HeaderCell, ['Variable']),
                  cellRenderer: ({ rowIndex }) => {
                    return h(TextCell, { style: inputTypeStyle(inputTableData[rowIndex].field_type) }, [
                      inputTableData[rowIndex].field_name,
                    ]);
                  },
                },
                {
                  size: { basis: 160, grow: 0 },
                  field: 'type',
                  headerRenderer: () => h(HeaderCell, ['Type']),
                  cellRenderer: ({ rowIndex }) => {
                    return h(TextCell, { style: inputTypeStyle(inputTableData[rowIndex].field_type) }, [
                      inputTableData[rowIndex].inputTypeStr,
                    ]);
                  },
                },
                {
                  size: { basis: 350, grow: 0 },
                  headerRenderer: () => h(HeaderCell, ['Input sources']),
                  cellRenderer: ({ rowIndex }) => {
                    const configurationIndex = inputTableData[rowIndex].configurationIndex;
                    const typePath = buildStructTypePath([configurationIndex]);
                    const typeNamePath = buildStructTypeNamePath([configurationIndex]);
                    const sourcePath = buildStructSourcePath([configurationIndex]);
                    const sourceNamePath = buildStructSourceNamePath([configurationIndex]);
                    return InputSourceSelect({
                      source: _.get(sourcePath, currentStructSource),
                      setSource: (source) => {
                        const newSource = _.flow([
                          _.set(
                            sourceNamePath,
                            _.get(sourceNamePath, currentStructSource) || _.get(typeNamePath, currentStructType)
                          ),
                          _.set(sourcePath, source),
                        ])(currentStructSource);
                        setCurrentStructSource(newSource);
                      },
                      inputType: _.get(typePath, currentStructType),
                    });
                  },
                },
                {
                  size: { basis: 300, grow: 1 },
                  headerRenderer: () => h(HeaderCell, [WorkflowTableColumnNames.INPUT_VALUE]),
                  cellRenderer: ({ rowIndex }) => {
                    // rowIndex is the index of this input in the currently displayed table
                    // configurationIndex is the index of this input the struct input definition
                    const configurationIndex = inputTableData[rowIndex].configurationIndex;
                    const typeNamePath = buildStructTypeNamePath([configurationIndex]);
                    const sourcePath = buildStructSourcePath([configurationIndex]);
                    const sourceNamePath = buildStructSourceNamePath([configurationIndex]);
                    const innerStructSource = _.get(sourcePath, currentStructSource);
                    const inputName = inputTableData[rowIndex].field_name;
                    const setInnerStructSource = (source) => {
                      const newSource = _.flow([
                        _.set(
                          sourceNamePath,
                          _.get(sourceNamePath, currentStructSource) || _.get(typeNamePath, currentStructType)
                        ),
                        _.set(sourcePath, source),
                      ])(currentStructSource);
                      setCurrentStructSource(newSource);
                    };
                    return h(WithWarnings, {
                      baseComponent: Utils.switchCase(
                        innerStructSource ? innerStructSource.type : 'none',
                        [
                          'literal',
                          () =>
                            h(ParameterValueTextInput, {
                              id: `structbuilder-table-attribute-select-${rowIndex}`,
                              inputType: inputTableData[rowIndex].field_type,
                              source: innerStructSource,
                              setSource: setInnerStructSource,
                            }),
                        ],
                        [
                          'record_lookup',
                          () =>
                            h(RecordLookupSelect, {
                              source: innerStructSource,
                              setSource: setInnerStructSource,
                              dataTableAttributes: _.pickBy(
                                (wdsType) => typeMatch(currentStructType.fields[rowIndex].field_type, wdsType.datatype),
                                dataTableAttributes
                              ),
                            }),
                        ],
                        [
                          'object_builder',
                          () =>
                            h(StructBuilderLink, {
                              onClick: () => setStructIndexPath([...structIndexPath, configurationIndex]),
                            }),
                        ],
                        [
                          'none',
                          () =>
                            h(TextCell, { style: inputTypeStyle(inputTableData[rowIndex].field_type) }, [
                              inputTableData[rowIndex].optional ? 'Optional' : 'This input is required',
                            ]),
                        ]
                      ),
                      message: inputValidations.find((validation) => validation.name === inputName),
                    });
                  },
                },
              ],
            }),
          ]);
        },
      ]),
    ]),
  ]);
};

type StructBuilderModalProps = Omit<StructBuilderProps, 'structIndexPath' | 'setStructIndexPath'> & {
  onDismiss: () => void;
};

export const StructBuilderModal = ({ onDismiss, ...props }: StructBuilderModalProps) => {
  const [structIndexPath, setStructIndexPath] = useState<number[]>([]);
  const topLevel = structIndexPath.length === 0;

  return h(
    Modal,
    {
      title: 'Struct Builder',
      onDismiss,
      showCancel: false,
      showX: true,
      okButton: h(
        ButtonPrimary,
        { onClick: topLevel ? onDismiss : () => setStructIndexPath(_.initial(structIndexPath)) },
        [topLevel ? 'Done' : 'Back']
      ),
      width: '90%',
    },
    [h(StructBuilder, { structIndexPath, setStructIndexPath, ...props })]
  );
};
