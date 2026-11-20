import { ButtonPrimary, Link, useThemeFromContext } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { icon } from 'src/components/icons';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

export interface ProductCardLink {
  label: string;
  href: string;
  /** Opens in a new tab and shows a pop-out icon */
  external?: boolean;
  onClick?: () => void;
}

// Room is kept for this many secondary links, so primary buttons line up across cards with different link counts.
const reservedLinkRows = 2;
const linkRowHeight = 22;
const linkGap = 12;

export interface ProductCardProps {
  /** Used to label the card for assistive technology */
  id: string;
  logo: { src: string; alt: string; height: number };
  /** Who the product is for, shown above the title */
  audience: string;
  title: string;
  description: ReactNode;
  primaryAction: ProductCardLink;
  links: ProductCardLink[];
  /** What the visitor needs before they can start, with a link to get it. Shown at the bottom of the card, below the links. */
  prerequisite: { text: string; link: ProductCardLink };
}

const CardLink = ({ label, href, external, onClick }: ProductCardLink): ReactNode => (
  <Link
    href={href}
    onClick={onClick}
    {...(external ? Utils.newTabLinkProps : {})}
    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: 15, fontWeight: 500 }}
  >
    {label}
    {icon(external ? 'pop-out' : 'arrowRight', { size: 14 })}
  </Link>
);

/**
 * One product a visitor can sign in to from the landing page. Every product card has the same structure, so the
 * choice reads as a comparison of equals; colors come from the surrounding theme, so wrap a card in that
 * product's ThemeProvider.
 */
export const ProductCard = (props: ProductCardProps): ReactNode => {
  const { id, logo, audience, title, description, primaryAction, links, prerequisite } = props;
  const { colors } = useThemeFromContext();
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      style={{
        ...Style.elements.card.container,
        justifyContent: undefined,
        flex: '1 1 0',
        minWidth: 300,
        padding: '1.5rem',
        borderRadius: 8,
        borderTop: `5px solid ${colors.primary()}`,
        color: colors.dark(),
      }}
    >
      <div style={{ height: 40, display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
        <img src={logo.src} alt={logo.alt} style={{ height: logo.height }} />
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: colors.dark(0.7),
        }}
      >
        {audience}
      </div>
      <h2 id={headingId} style={{ fontSize: 22, fontWeight: 600, lineHeight: '28px', margin: '0.25rem 0 0.5rem' }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.5, flexGrow: 1, marginBottom: '1.5rem' }}>{description}</div>
      <ButtonPrimary
        href={primaryAction.href}
        onClick={primaryAction.onClick}
        {...(primaryAction.external ? Utils.newTabLinkProps : {})}
        style={{ height: '2.75rem', fontSize: 15, textTransform: 'none', width: '100%' }}
      >
        {primaryAction.label}
      </ButtonPrimary>
      <ul
        style={{
          listStyle: 'none',
          padding: '1rem 0 0',
          margin: '1.25rem 0 0',
          borderTop: `1px solid ${colors.dark(0.15)}`,
          display: 'flex',
          flexDirection: 'column',
          gap: linkGap,
          minHeight: reservedLinkRows * linkRowHeight + (reservedLinkRows - 1) * linkGap,
          boxSizing: 'content-box',
        }}
      >
        {links.map((link) => (
          <li key={link.label} style={{ lineHeight: `${linkRowHeight}px` }}>
            <CardLink {...link} />
          </li>
        ))}
      </ul>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          padding: '0.75rem 1rem',
          marginTop: '1.25rem',
          borderRadius: 6,
          backgroundColor: colors.light(),
        }}
      >
        <div style={{ marginBottom: '0.25rem' }}>{prerequisite.text}</div>
        <CardLink {...prerequisite.link} />
      </div>
    </section>
  );
};
