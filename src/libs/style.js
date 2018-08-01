import colors from 'src/libs/colors'

export const standardShadow = '0 3px 2px 0 rgba(0,0,0,0.12)'
export const modalShadow = '0 0 8px 0 rgba(0,0,0,0.12), 0 8px 8px 0 rgba(0,0,0,0.24)'

export const standardLine = `1px solid ${colors.text[2]}`

export const elements = {
  cardTitle: { color: colors.primary[0], fontSize: 16 },
  card: {
    borderRadius: 5, padding: '1rem', wordWrap: 'break-word', boxShadow: standardShadow,
    backgroundColor: 'white'
  },
  input: {
    style: { border: `1px solid ${colors.text[3]}`, borderRadius: 4, height: '2.25rem' },
    focus: { border: `1px solid ${colors.primary[0]}` }
  },
  pageTitle: {
    color: colors.title[0], fontSize: 22, fontWeight: 500, textTransform: 'uppercase'
  },
  sectionHeader: { color: colors.title[0], fontSize: 16, fontWeight: 500 }
}
