export const colors = {
  accent: '#8b5f95',
  background: '#e5e5e5',
  disabled: '#9b9b9b',
  highlight: '#bfd5e3',
  highlightFaded: '#e7f1f7',
  primary: '#5faee0',
  secondary: '#478eba',
  text: '#4a4a4a',
  textAlt: '#bde5ff',
  textFaded: '#a6a6a6',
  textFadedLight: '#c5e1f3',
  title: '#224f83',
  titleAlt: '#8299a5'
}

export const standardShadow = '0 3px 2px 0 rgba(0,0,0,0.12)'
export const modalShadow = '0 0 8px 0 rgba(0,0,0,0.12), 0 8px 8px 0 rgba(0,0,0,0.24)'
export const contextMenuShadow = '0 2px 5px 0 rgba(0,0,0,0.26), 0 2px 10px 0 rgba(0,0,0,0.16)'

export const elements = {
  button: { fontWeight: 500, fontSize: 14, textTransform: 'uppercase', cursor: 'pointer' },
  cardTitle: { color: colors.secondary, fontSize: 16, fontWeight: 500 },
  card: {
    borderRadius: 5, padding: '1rem', wordWrap: 'break-word', boxShadow: standardShadow,
    backgroundColor: 'white'
  },
  input: { border: '1px solid #c3c3c3', borderRadius: 4, height: '2.25rem' },
  pageTitle: {
    color: colors.title, fontSize: 22, fontWeight: 500, textTransform: 'uppercase',
    textDecoration: 'none'
  },
  sectionHeader: { color: colors.title, fontSize: 16 }
}
