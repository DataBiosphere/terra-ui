import { Icon } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode } from 'react';
import { ButtonPrimary, LabeledCheckbox, Link } from 'src/components/common';
import { InfoBox } from 'src/components/InfoBox';
import { MenuButton } from 'src/components/MenuButton';
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger';
import { ariaSort, HeaderRenderer } from 'src/components/table';
import { BillingRole } from 'src/libs/ajax/Billing';
import { GroupRole } from 'src/libs/ajax/Groups';
import { cardList as cardListStyles } from 'src/libs/style';

interface AdminNotifierCheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}
export const AdminNotifierCheckbox = (props: AdminNotifierCheckboxProps) => (
  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
    <LabeledCheckbox style={{ marginRight: '0.25rem' }} checked={props.checked} onChange={props.onChange}>
      Allow anyone to request access
    </LabeledCheckbox>
    <InfoBox style={{ marginLeft: '0.3rem' }}>
      Any user will be able to request to become a member of this group. This will send an email to the group admins.
    </InfoBox>
  </div>
);

interface NewUserCardProps {
  onClick: () => void;
}
export const NewUserCard = (props: NewUserCardProps) => (
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

export const MemberCardHeaders = (props: MemberCardHeadersProps): ReactNode => (
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

export type UserRole = BillingRole | GroupRole;

export interface User {
  email: string;
  roles: UserRole[];
}

interface MemberCardProps {
  member: User;
  adminCanEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  adminLabel: string;
  userLabel: string;
  isOwner: boolean;
}

export const MemberCard = (props: MemberCardProps): ReactNode => {
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
