const colors = {
  accent: '#8b5f95',
  background: '#e5e5e5',
  disabled: '#9b9b9b',
  highlight: '#bfd5e3',
  primary: '#5faee0',
  secondary: '#478eba',
  text: '#4a4a4a',
  textFaded: '#a6a6a6',
  textAlt: '#bde5ff',
  title: '#224f83'
}

const elements = {
  button: { color: 'black', fontWeight: 500, textTransform: 'uppercase' },
  cardTitle: { color: colors.secondary, fontSize: 16, fontWeight: 500 },
  pageTitle: {
    color: colors.title, fontSize: 22, fontWeight: 500,
    textTransform: 'uppercase', textDecoration: 'none'
  },
  sectionHeader: { color: colors.title, fontSize: 16 }
}

export { colors, elements }
