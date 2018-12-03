import colors from 'src/libs/colors'


export const standardShadow = '0 3px 2px 0 rgba(0,0,0,0.12)'
export const modalShadow = '0 0 8px 0 rgba(0,0,0,0.12), 0 8px 8px 0 rgba(0,0,0,0.24)'

export const standardLine = `1px solid ${colors.gray[2]}`

export const elements = {
  cardTitle: { color: colors.blue[0], fontSize: 16 },
  card: {
    borderRadius: 5, padding: '1rem', wordWrap: 'break-word', boxShadow: standardShadow,
    backgroundColor: 'white'
  },
  sectionHeader: { color: colors.darkBlue[0], fontSize: 16, fontWeight: 'bold' },
  pageContentContainer: { position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column' }
}

export const tabBar = {
  container: {
    display: 'flex', alignItems: 'center', backgroundColor: colors.blue[1],
    fontWeight: 500, color: 'white', textTransform: 'uppercase',
    height: '3.75rem', padding: '0 1rem',
    paddingLeft: '5rem', borderBottom: `5px solid ${colors.blue[0]}`
  },
  tab: {
    minWidth: 140, flexGrow: 0, padding: '0 20px',
    color: colors.gray[4],
    alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  active: {
    backgroundColor: 'rgba(255,255,255,0.15)', color: 'unset',
    borderBottom: `4px solid ${colors.blue[0]}`, fontWeight: 'bold'
  }
}
