import { Icon } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { ButtonPrimary, Link } from 'src/components/common';
import { MenuButton } from 'src/components/MenuButton';
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger';
import { ariaSort, HeaderRenderer } from 'src/components/table';
import { cardList as cardListStyles } from 'src/libs/style';

export interface Member {
  email: string;
  roles: string[];
}

interface MemberTableProps {
  adminLabel: string;
  userLabel: string;
  members: Member[];
  adminCanEdit: boolean;
  onEdit: (user: Member) => void;
  onDelete: (user: Member) => void;
  tableAriaLabel: string;
  isOwner: boolean;
  onAddUser: () => void;
}

export const MemberTable = (props: MemberTableProps): ReactNode => {
  const [sort, setSort] = useState<Sort>({ field: 'email', direction: 'asc' });

  return (
    <div style={{ marginTop: '1rem' }}>
      {props.isOwner && <NewUserCard onClick={props.onAddUser} />}
      <div role='table' aria-label={props.tableAriaLabel}>
        <MemberCardHeaders sort={sort} onSort={setSort} />
        <div style={{ flexGrow: 1, marginTop: '1rem' }}>
          {_.map(
            (member: Member) => (
              <MemberCard
                key={member.email}
                adminLabel={props.adminLabel}
                userLabel={props.userLabel}
                member={member}
                adminCanEdit={props.adminCanEdit}
                onEdit={() => props.onEdit(member)}
                onDelete={() => props.onDelete(member)}
                isOwner={props.isOwner}
              />
            ),
            _.orderBy([sort.field], [sort.direction], props.members)
          )}
        </div>
      </div>
    </div>
  );
};

interface NewUserCardProps {
  onClick: () => void;
}
const NewUserCard = (props: NewUserCardProps) => (
  <ButtonPrimary style={{ textTransform: 'none' }} onClick={props.onClick}>
    <Icon icon='plus' size={14} />
    <div style={{ marginLeft: '0.5rem' }}>Add User</div>
  </ButtonPrimary>
);

interface UserMenuContentProps {
  onEdit: () => void;
  onDelete: () => void;
}

const UserMenuContent = (props: UserMenuContentProps) => (
  <>
    <MenuButton onClick={props.onEdit}>
      {makeMenuIcon('edit')}
      Edit Role
    </MenuButton>
    <MenuButton onClick={props.onDelete}>
      {makeMenuIcon('trash')}
      Remove User
    </MenuButton>
  </>
);

const menuCardSize = 20;

export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

interface MemberCardHeadersProps {
  sort: Sort;
  onSort: (v: Sort) => void;
}

const MemberCardHeaders = (props: MemberCardHeadersProps): ReactNode => (
  <div role='row' style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', padding: '0 1rem' }}>
    <div role='columnheader' aria-sort={ariaSort(props.sort, 'email')} style={{ flex: 1 }}>
      <HeaderRenderer sort={props.sort} onSort={props.onSort} name='email' />
    </div>
    <div role='columnheader' aria-sort={ariaSort(props.sort, 'roles')} style={{ flex: 1 }}>
      <HeaderRenderer sort={props.sort} onSort={props.onSort} name='roles' />
    </div>
    <div
      role='columnheader'
      // Width is the same as the menu icon.
      style={{ width: menuCardSize }}
    >
      <div className='sr-only'>Actions</div>
    </div>
  </div>
);

interface MemberCardProps {
  member: Member;
  adminCanEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  adminLabel: string;
  userLabel: string;
  isOwner: boolean;
}

const MemberCard = (props: MemberCardProps): ReactNode => {
  const {
    member: { email, roles },
    adminCanEdit,
    onEdit,
    onDelete,
    adminLabel,
    userLabel,
    isOwner,
  } = props;
  const canEdit = adminCanEdit || !_.includes(adminLabel, roles);
  const tooltip = !canEdit && `This user is the only ${adminLabel}`;

  return (
    <div role='row' style={cardListStyles.longCardShadowless}>
      <div
        role='rowheader'
        style={{ flex: '1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', height: '1rem' }}
      >
        {email}
      </div>
      <div role='cell' style={{ flex: '1', textTransform: 'capitalize', height: '1rem' }}>
        {_.includes(adminLabel, roles) ? adminLabel : userLabel}
      </div>
      {isOwner && (
        <div role='cell' style={{ flex: 'none' }}>
          <MenuTrigger
            side='left'
            style={{ height: menuCardSize, width: menuCardSize }}
            closeOnClick
            content={<UserMenuContent onEdit={onEdit} onDelete={onDelete} />}
          >
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <Link aria-label={`Menu for User: ${email}`} disabled={!canEdit} tooltip={tooltip} tooltipSide='left'>
              <Icon icon='cardMenuIcon' size={menuCardSize} />
            </Link>
          </MenuTrigger>
        </div>
      )}
    </div>
  );
};
