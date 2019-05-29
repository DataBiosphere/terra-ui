import colors from 'src/libs/colors'


export const standardShadow = '0 3px 2px 0 rgba(0,0,0,0.12)'
export const modalShadow = '0 0 8px 0 rgba(0,0,0,0.12), 0 8px 8px 0 rgba(0,0,0,0.24)'

export const standardLine = `1px solid ${colors.gray[2]}`

export const proportionalNumbers = { fontVariantNumeric: 'proportional-nums', fontFeatureSettings: 'initial' }

export const noWrapEllipsis = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

export const elements = {
  card: {
    title: { color: colors.green[0], fontSize: 16, overflow: 'hidden' },
    container: {
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      borderRadius: 5, padding: '1rem', wordWrap: 'break-word',
      backgroundColor: 'white',
      boxShadow: '0 2px 5px 0 rgba(0,0,0,0.35), 0 3px 2px 0 rgba(0,0,0,0.12)'
    }
  },
  sectionHeader: { color: colors.gray[0], fontSize: 16, fontWeight: 600 },
  pageContentContainer: { position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column', zIndex: 0 }
}

export const tabBar = {
  container: {
    display: 'flex', alignItems: 'center', backgroundColor: colors.grayBlue[6],
    fontWeight: 500, textTransform: 'uppercase',
    height: '3.75rem', paddingRight: '1rem',
    borderBottom: `2px solid ${colors.green[1]}`, flex: 'none',
    boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)', zIndex: 1
  },
  tab: {
    minWidth: 140, flexGrow: 0, padding: '0 20px',
    color: colors.green[0],
    alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  active: {
    backgroundColor: colors.green[6], color: 'unset',
    borderBottomWidth: 8, borderBottomStyle: 'solid', borderBottomColor: colors.green[1],
    fontWeight: 600
  },
  hover: {
    backgroundColor: colors.green[6], color: colors.green[1]
  }
}

export const cardList = {
  cardContainer: {
    marginTop: '1rem',
    display: 'flex', flexWrap: 'wrap'
  },
  shortCreateCard: {
    ...elements.card.container,
    justifyContent: 'center',
    width: 180, height: 100,
    margin: '0.25rem 1rem 0 0',
    color: colors.green[0], fontSize: 18, lineHeight: '22px'
  },
  longCard: {
    ...elements.card.container,
    alignItems: 'center', flexDirection: undefined,
    width: '100%', minWidth: 0,
    margin: '0.25rem 0.5rem 0.5rem 0',
    fontSize: 13
  },
  longTitle: {
    ...elements.card.title,
    ...noWrapEllipsis
  },
  toolbarContainer: {
    flex: 'none', display: 'flex', alignItems: 'flex-end'
  }
}

export const breadcrumb = {
  breadcrumb: {
    display: 'flex', flexDirection: 'column',
    paddingLeft: '4rem', minWidth: 0, marginRight: '0.5rem'
  },
  textUnderBreadcrumb: {
    color: 'white',
    fontSize: '1.25rem', ...noWrapEllipsis
  }
}
