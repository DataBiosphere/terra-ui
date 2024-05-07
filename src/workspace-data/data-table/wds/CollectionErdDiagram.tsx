import { useAutoLoadedData } from '@terra-ui-packages/components';
import mermaid from 'mermaid';
import React, { ReactNode, useEffect, useRef } from 'react';
import { RecordTypeSchema } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import { WorkspaceData } from 'src/libs/ajax/WorkspaceDataService';

const indent = (s, level = 1) =>
  s
    .split('\n')
    .map((line) => `${line}`.padStart(s.length + level * 2, ' '))
    .join('\n');

const buildErdDiagram = (schema: RecordTypeSchema[]): string => {
  const description = [
    'erDiagram',
    ...schema.flatMap((table) => {
      const relationAttributes = table.attributes.filter((attr) => attr.datatype === 'RELATION');
      const otherAttributes = table.attributes.filter((attr) => attr.datatype !== 'RELATION');

      return [
        `${table.name} {`,
        ...otherAttributes.map((attr) => indent(`${attr.datatype} ${attr.name}`)),
        '}',
        ...relationAttributes.map((attr) => `${table.name} }|--|| ${attr.relatesTo} : ${attr.name}`),
      ].map((s) => indent(s));
    }),
  ].join('\n');

  return description;
};

interface MermaidProps {
  description: string;
}

const Mermaid = (props: MermaidProps): ReactNode => {
  const { description } = props;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.mermaidAPI.initialize({
      startOnLoad: true,
      securityLevel: 'loose',
      theme: 'forest',
      logLevel: 5,
    });
  });

  useEffect(() => {
    if (ref.current && description !== '') {
      mermaid.mermaidAPI.render('preview', description).then(({ svg }) => {
        ref.current!.innerHTML = svg;
      });
    }
  }, [description]);

  return <div ref={ref} />;
};

export interface CollectionErdDiagramProps {
  collectionId: string;
  wdsProxyUrl: string;
}

export const CollectionErdDiagram = (props: CollectionErdDiagramProps): ReactNode => {
  const { collectionId, wdsProxyUrl } = props;

  const [schema] = useAutoLoadedData(
    () => WorkspaceData(undefined).getSchema(wdsProxyUrl, collectionId),
    [collectionId, wdsProxyUrl]
  );

  return schema.status === 'Ready' && <Mermaid description={buildErdDiagram(schema.state)} />;
};
