import { Interactive, TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment } from 'react';
import { h, span } from 'react-hyperscript-helpers';
import { parseGsUri } from 'src/components/data/data-utils';
import { icon } from 'src/components/icons';
import { TextCell } from 'src/components/table';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';
import { getAttributeType } from 'src/workspace-data/data-table/entity-service/attribute-utils';
import { isAzureWorkspace, isGoogleWorkspace } from 'src/workspaces/utils';

import { UriViewerLink } from '../shared/UriViewerLink';
import { isAzureUri, isDrsUri, isGsUri } from '../uri-viewer/uri-viewer-utils';

const isViewableUri = (datum, workspace) =>
  (isGoogleWorkspace(workspace) && isGsUri(datum)) || (isAzureWorkspace(workspace) && isAzureUri(datum)) || isDrsUri(datum);

const maxListItemsRendered = 100;

const renderDataCellTooltip = (attributeValue) => {
  const { type, isList } = getAttributeType(attributeValue);

  const renderArrayTooltip = (items) => {
    return _.flow(
      _.slice(0, maxListItemsRendered),
      items.length > maxListItemsRendered ? Utils.append(`and ${items.length - maxListItemsRendered} more`) : _.identity,
      _.join(', ')
    )(items);
  };

  return Utils.cond(
    [type === 'json' && _.isArray(attributeValue) && !_.some(_.isObject, attributeValue), () => renderArrayTooltip(attributeValue)],
    [type === 'json', () => JSON.stringify(attributeValue, undefined, 1)],
    [type === 'reference' && isList, () => renderArrayTooltip(_.map('entityName', attributeValue.items))],
    [type === 'reference', () => attributeValue.entityName],
    [isList, () => renderArrayTooltip(attributeValue.items)],
    () => attributeValue?.toString()
  );
};

export const renderDataCell = (attributeValue, workspace) => {
  const {
    workspace: { bucketName: workspaceBucket },
  } = workspace;

  const renderCell = (datum) => {
    // handle nested arrays, where datum is itself an array. Recurse back to renderArray() for this, but surround its
    // result with [] to indicate to the end user where the nested arrays start and stop
    if (_.isArray(datum)) {
      return span({}, ['[', renderArray(datum), ']']);
    }
    // handle non-nested arrays:
    const stringDatum = Utils.convertValue('string', datum);
    return isViewableUri(datum, workspace) ? h(UriViewerLink, { uri: datum, workspace }) : stringDatum;
  };

  const renderArray = (items) => {
    return _.flow(
      _.slice(0, maxListItemsRendered),
      items.length > maxListItemsRendered ? Utils.append(`and ${items.length - maxListItemsRendered} more`) : _.identity,
      Utils.toIndexPairs,
      _.flatMap(([i, v]) =>
        h(Fragment, { key: i }, [i > 0 && span({ style: { marginRight: '0.5rem', color: colors.dark(0.85) } }, ','), renderCell(v)])
      )
    )(items);
  };

  const { type, isList } = getAttributeType(attributeValue);

  const tooltip = renderDataCellTooltip(attributeValue);

  const isNonCurrentWorkspaceUrls = (datum) => {
    if (isGoogleWorkspace(workspace)) {
      const [bucket] = parseGsUri(datum);
      return !!bucket && bucket !== workspaceBucket;
    }
    if (isAzureWorkspace(workspace)) {
      if (isAzureUri(datum)) {
        const workspaceId = parseAzureUri(datum);
        return workspace.workspace.workspaceId !== workspaceId;
      }
    }
    return false;
  };

  const parseAzureUri = (datum) => {
    if (typeof datum !== 'string' || datum.split('/').length < 4) {
      return null;
    }
    return datum.split('/')[3].replace('sc-', '');
  };

  const hasNonCurrentWorkspaceUrls = Utils.cond(
    [type === 'json' && _.isArray(attributeValue), () => _.some(isNonCurrentWorkspaceUrls, attributeValue)],
    [(type === 'string' || type === 'object') && isList, () => _.some(isNonCurrentWorkspaceUrls, attributeValue.items)],
    [type === 'string', () => isNonCurrentWorkspaceUrls(attributeValue)],
    () => false
  );

  return h(Fragment, [
    hasNonCurrentWorkspaceUrls &&
      h(TooltipTrigger, { content: 'Some files are located outside of the current workspace' }, [
        h(Interactive, { tagName: 'span', tabIndex: 0, style: { marginRight: '1ch' } }, [
          icon('warning-info', { size: 20, style: { color: colors.accent(), cursor: 'help' } }),
        ]),
      ]),
    h(TextCell, { title: tooltip }, [
      Utils.cond(
        [type === 'json' && _.isArray(attributeValue) && !_.some(_.isObject, attributeValue), () => renderArray(attributeValue)],
        [type === 'json', () => JSON.stringify(attributeValue, undefined, 1)],
        [type === 'reference' && isList, () => renderArray(_.map('entityName', attributeValue.items))],
        [type === 'reference', () => attributeValue.entityName],
        [isList, () => renderArray(attributeValue.items)],
        () => renderCell(attributeValue)
      ),
    ]),
  ]);
};
