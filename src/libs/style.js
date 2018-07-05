export const colors = {
  accent: '#8b5f95',
  background: '#e5e5e5',
  border: '#c3c3c3',
  disabled: '#9b9b9b',
  error: '#c92100',
  errorFaded: '#f5dbd9',
  focus: '#007cbb',
  highlight: '#bfd5e3',
  highlightFaded: '#e7f1f7',
  primary: '#5faee0',
  secondary: '#2691d0',
  section: '#f2f7f9',
  sectionBorder: '#5e9cc1',
  sectionHighlight: '#deeaf2',
  standout: '#c55a68',
  success: '#7ac79b',
  text: '#4a4a4a',
  textAlt: '#bde5ff',
  textFaded: '#a6a6a6',
  textFadedLight: '#c5e1f3',
  title: '#224f83',
  titleAlt: '#8299a5',
  warning: '#e28327',
  warningBackground: '#fffcec'
}

export const standardShadow = '0 3px 2px 0 rgba(0,0,0,0.12)'
export const modalShadow = '0 0 8px 0 rgba(0,0,0,0.12), 0 8px 8px 0 rgba(0,0,0,0.24)'

export const standardLine = `1px solid ${colors.textFaded}`

export const elements = {
  cardTitle: { color: colors.secondary, fontSize: 16 },
  card: {
    borderRadius: 5, padding: '1rem', wordWrap: 'break-word', boxShadow: standardShadow,
    backgroundColor: 'white'
  },
  input: {
    style: { border: `1px solid ${colors.border}`, borderRadius: 4, height: '2.25rem' },
    focus: { border: `1px solid ${colors.focus}` }
  },
  pageTitle: {
    color: colors.title, fontSize: 22, fontWeight: 500, textTransform: 'uppercase'
  },
  sectionHeader: { color: colors.title, fontSize: 16, fontWeight: 500 }
}
