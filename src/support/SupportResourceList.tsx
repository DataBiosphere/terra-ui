import _ from 'lodash/fp';
import React from 'react';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { SupportResourceListItem, SupportResourceListItemProps } from 'src/support/SupportResourceListItem';
import { supportResources, SupportResourceType } from 'src/support/SupportResourceType';

interface SupportResourceListProps {
  queryParams: {
    selectedType: string | undefined;
    resourceName: string | undefined;
  };
}

export const SupportResourceList = (props: SupportResourceListProps) => {
  const selectedType = props.queryParams.selectedType || '';
  const resourceName = props.queryParams.resourceName || '';
  const supportResourceListWidth = 350;

  const makeResourceListItemProps = (resourceType: SupportResourceType): SupportResourceListItemProps => {
    return {
      resourceType,
      isActive: !!selectedType && resourceType.resourceType === selectedType,
    };
  };

  return (
    <div role="main" style={{ display: 'flex', flex: 1, height: `calc(100% - ${Style.topBarHeight}px)` }}>
      <div
        style={{
          minWidth: supportResourceListWidth,
          maxWidth: supportResourceListWidth,
          boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)',
          overflowY: 'auto',
        }}
      >
        <div role="list">
          {_.map(
            (supportResource) => (
              <SupportResourceListItem
                key={supportResource.resourceType}
                {...makeResourceListItemProps(supportResource)}
              />
            ),
            supportResources
          )}
        </div>
      </div>
      <div
        style={{
          overflowY: 'auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {Utils.cond(
          [
            !!selectedType,
            () => {
              const supportResourceType = _.find({ resourceType: selectedType }, supportResources);
              if (supportResourceType) {
                return React.createElement(supportResourceType.detailComponent, {
                  displayName: supportResourceType.displayName,
                  fqResourceId: { resourceTypeName: selectedType, resourceId: resourceName },
                });
              }
              return <div style={{ margin: '1rem auto 0 auto' }}>Select a Resource Type</div>;
            },
          ],
          [
            !selectedType,
            () => {
              return <div style={{ margin: '1rem auto 0 auto' }}>Select a Resource Type</div>;
            },
          ]
        )}
      </div>
    </div>
  );
};
