import { SpinnerOverlay } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { useEffect, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { DeleteConfirmationModal } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { Sort } from 'src/components/group-common';
import { DelayedSearchInput } from 'src/components/input';
import LeaveResourceModal from 'src/components/LeaveResourceModal';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import TopBar from 'src/components/TopBar';
import { GroupCard } from 'src/groups/GroupCard';
import { GroupCardHeaders } from 'src/groups/GroupCardHeaders';
import { NewGroupCard } from 'src/groups/NewGroupCard';
import { NewGroupModal } from 'src/groups/NewGroupModal';
import { NoGroupsMessage } from 'src/groups/NoGroupsMessage';
import { Ajax } from 'src/libs/ajax';
import { CurrentUserGroupMembership } from 'src/libs/ajax/Groups';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import * as StateHistory from 'src/libs/state-history';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

export const GroupList = (): React.ReactNode => {
  // State
  const [filter, setFilter] = useState(() => StateHistory.get().filter || '');
  const [groups, setGroups] = useState<CurrentUserGroupMembership[]>(() => StateHistory.get().groups || []);
  const [creatingNewGroup, setCreatingNewGroup] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<CurrentUserGroupMembership>();
  const [leavingGroup, setLeavingGroup] = useState<CurrentUserGroupMembership>();
  const [updating, setUpdating] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [sort, setSort] = useState<Sort>({ field: 'groupName', direction: 'asc' });

  const signal = useCancellation();

  // Helpers
  const refresh = _.flow(
    Utils.withBusyState(setBusy),
    withErrorReporting('Error loading group list')
  )(async () => {
    setCreatingNewGroup(false);
    setDeletingGroup(undefined);
    setUpdating(false);

    const rawGroups = await Ajax(signal).Groups.list();
    const groups = _.flow(
      _.groupBy('groupName'),
      _.map((gs) => ({ ...gs[0], role: _.map('role', gs) })),
      _.sortBy('groupName')
    )(rawGroups);
    setGroups(groups);
  });

  // Lifecycle
  useOnMount(() => {
    refresh();
  });

  useEffect(() => {
    StateHistory.update({ filter, groups });
  }, [filter, groups]);

  // Render
  const filteredGroups = _.filter(({ groupName }) => Utils.textMatch(filter, groupName), groups);

  return (
    <FooterWrapper>
      {/* @ts-expect-error */}
      <TopBar title='Groups'>
        <DelayedSearchInput
          aria-label='Search groups'
          style={{ marginLeft: '2rem', width: 500 }}
          placeholder='SEARCH GROUPS'
          onChange={setFilter}
          value={filter}
        />
      </TopBar>
      <PageBox role='main' style={{ flexGrow: 1 }} variant={PageBoxVariants.light}>
        <div style={Style.cardList.toolbarContainer}>
          <h2 style={{ ...Style.elements.sectionHeader, margin: 0, textTransform: 'uppercase' }}>Group Management</h2>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <NewGroupCard onClick={() => setCreatingNewGroup(true)} />
          {Utils.cond(
            [groups && _.isEmpty(groups), () => <NoGroupsMessage />],
            [
              !_.isEmpty(groups) && _.isEmpty(filteredGroups),
              () => <div style={{ fontStyle: 'italic', marginTop: '1rem' }}>No matching groups</div>,
            ],
            () => {
              return div({ role: 'table', 'aria-label': 'groups list' }, [
                h(GroupCardHeaders, { sort, onSort: setSort }),
                <div style={{ flexGrow: 1, marginTop: '1rem', display: 'grid', rowGap: '0.5rem' }}>
                  {_.map((group: CurrentUserGroupMembership) => {
                    return h(GroupCard, {
                      group,
                      key: `${group.groupName}`,
                      onDelete: () => setDeletingGroup(group),
                      onLeave: () => setLeavingGroup(group),
                    });
                  }, _.orderBy([sort.field], [sort.direction], filteredGroups))}
                </div>,
              ]);
            }
          )}
          {busy && <SpinnerOverlay />}
        </div>
        {creatingNewGroup && (
          <NewGroupModal
            existingGroups={_.map('groupName', groups)}
            onDismiss={() => setCreatingNewGroup(false)}
            onSuccess={refresh}
          />
        )}
        {deletingGroup && (
          <DeleteConfirmationModal
            objectType='group'
            objectName={deletingGroup.groupName}
            onConfirm={_.flow(
              Utils.withBusyState(setBusy),
              withErrorReporting('Error deleting group.')
            )(async () => {
              setDeletingGroup(undefined);
              await Ajax().Groups.group(deletingGroup.groupName).delete();
              refresh();
            })}
            onDismiss={() => setDeletingGroup(undefined)}
          />
        )}
        {leavingGroup && (
          <LeaveResourceModal
            samResourceId={leavingGroup.groupName}
            samResourceType='managed-group'
            displayName='group'
            onDismiss={() => setLeavingGroup(undefined)}
            onSuccess={refresh}
          />
        )}
        {updating && <SpinnerOverlay />}
      </PageBox>
    </FooterWrapper>
  );
};
