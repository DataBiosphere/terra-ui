import { Clickable, Icon, IconId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { CSSProperties, PropsWithChildren, ReactNode } from 'react';
import { UnmountClosed as RCollapse } from 'react-collapse';
import { isScientificServices, isTerra } from 'src/libs/brand-utils';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

export const topBarStyle: CSSProperties = {
  flex: 'none',
  height: Style.topBarHeight,
  display: 'flex',
  alignItems: 'center',
  borderBottom: `2px solid ${colors.primary(0.55)}`,
  zIndex: 2,
  boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
};

export const pageTitleStyles: CSSProperties = {
  color: isTerra() ? 'white' : colors.dark(),
  fontSize: 22,
  fontWeight: 500,
  textTransform: 'uppercase',
};

export const navSectionStyles: CSSProperties = {
  flex: 'none',
  height: isScientificServices() ? 55 : 70,
  padding: '0 28px',
  fontWeight: 600,
  borderTop: `1px solid ${colors.dark(0.55)}`,
  color: 'white',
};

export const navBackgroundStyles: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  overflow: 'auto',
  cursor: 'pointer',
  zIndex: 2,
};

export const navIconStyles: CSSProperties = {
  marginRight: 12,
  flex: 'none',
};

export const navContainerStyles = (state: string): CSSProperties => ({
  ...(state === 'entered' ? {} : { opacity: 0, transform: 'translate(-2rem)' }),
  transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
  paddingTop: Style.topBarHeight,
  width: 290,
  color: 'white',
  position: 'absolute',
  cursor: 'default',
  backgroundColor: colors.dark(0.8),
  height: '100%',
  boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
});

export const NavItem = ({ children, ...props }): ReactNode => (
  <Clickable
    {..._.merge(
      {
        style: { display: 'flex', alignItems: 'center', color: 'white', outlineOffset: -4 },
        hover: { backgroundColor: colors.dark(0.55) },
      },
      props
    )}
  >
    {children}
  </Clickable>
);

export const NavSection = ({ children, ...props }): ReactNode => (
  <div role='listitem'>
    <NavItem {..._.merge({ style: navSectionStyles }, props)}>{children}</NavItem>
  </div>
);

export const DropDownSubItem = ({ children, ...props }): ReactNode => (
  <div role='listitem'>
    <NavItem {..._.merge({ style: { padding: '0 3rem', height: 40, fontWeight: 500 } }, props)}>{children}</NavItem>
  </div>
);

export interface DropDownSectionProps extends PropsWithChildren {
  titleIcon?: IconId;
  title: ReactNode;
  isOpened: boolean;
  onClick: () => void;
}

export const DropDownSection = (props: DropDownSectionProps): ReactNode => {
  const { titleIcon, title, isOpened, onClick, children } = props;
  return (
    <div role='group'>
      <NavItem onClick={onClick} aria-expanded={isOpened} aria-haspopup='menu' style={navSectionStyles}>
        {titleIcon && <Icon icon={titleIcon} size={24} style={navIconStyles} />}
        {title}
        <div style={{ flexGrow: 1 }} />
        <Icon icon={isOpened ? 'angle-up' : 'angle-down'} size={18} style={{ flex: 'none' }} />
      </NavItem>
      <div style={{ flex: 'none' }}>
        <RCollapse isOpened={isOpened}>{children}</RCollapse>
      </div>
    </div>
  );
};
