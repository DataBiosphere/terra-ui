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
  sectionHeader: { color: colors.darkBlue[0], fontSize: 16, fontWeight: 'bold' }
}
