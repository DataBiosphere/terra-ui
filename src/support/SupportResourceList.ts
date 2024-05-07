import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { ManagedGroupSummary } from 'src/support/ManagedGroupSummary';
import { SupportResourceListItem, SupportResourceListItemProps } from 'src/support/SupportResourceListItem';
import { SupportResourceType } from 'src/support/SupportResourceType';

interface SupportResourceListProps {
  queryParams: {
    selectedType: string | undefined;
    resourceName: string | undefined;
  };
}

export const SupportResourceList = (props: SupportResourceListProps) => {
  const selectedType = props.queryParams.selectedType;
  const resourceName = props.queryParams.resourceName;
  const supportResourceListWidth = 350;
  const supportResources: SupportResourceType[] = [
    { displayName: 'Group', resourceType: 'managed-group', detailComponent: ManagedGroupSummary },
  ];

  const makeResourceListItemProps = (resourceType: SupportResourceType): SupportResourceListItemProps => {
    return {
      resourceType,
      isActive: !!selectedType && resourceType.resourceType === selectedType,
    };
  };

  return div({ role: 'main', style: { display: 'flex', flex: 1, height: `calc(100% - ${Style.topBarHeight}px)` } }, [
    div(
      {
        style: {
          minWidth: supportResourceListWidth,
          maxWidth: supportResourceListWidth,
          boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)',
          overflowY: 'auto',
        },
      },
      [
        div({ role: 'list' }, [
          _.map(
            (supportResource) =>
              h(SupportResourceListItem, {
                key: supportResource.resourceType,
                ...makeResourceListItemProps(supportResource),
              }),
            supportResources
          ),
        ]),
      ]
    ),
    div(
      {
        style: {
          overflowY: 'auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      },
      [
        Utils.cond(
          [
            !!selectedType && _.some({ resourceType: selectedType }, supportResources),
            () => {
              const supportResourceType = _.find({ resourceType: selectedType }, supportResources);
              return h(supportResourceType.detailComponent, {
                displayName: supportResourceType.displayName,
                fqResourceId: { resourceTypeName: selectedType, resourceId: resourceName },
              });
            },
          ],
          [
            !selectedType,
            () => {
              return div({ style: { margin: '1rem auto 0 auto' } }, ['Select a Resource Type']);
            },
          ]
        ),
      ]
    ),
  ]);
};
