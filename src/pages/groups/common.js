import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'


export const styles = {
  cardContainer: {
    position: 'relative',
    padding: '0 4rem 0 5rem',
    display: 'flex', flexWrap: 'wrap'
  },
  shortCreateCard: {
    ...Style.elements.card,
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    width: 180, height: 100,
    margin: '0.25rem 1rem 0 0',
    color: colors.primary[0], fontSize: 18, lineHeight: '22px'
  },
  longCard: {
    ...Style.elements.card,
    display: 'flex', alignItems: 'center',
    width: '100%', minWidth: 0,
    margin: '0.25rem 0.5rem 0.5rem 0',
    fontSize: 13
  },
  longTitle: {
    fontSize: 16,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  toolbarContainer: {
    flex: 'none', display: 'flex', alignItems: 'flex-end',
    margin: '2rem 4rem 2rem 5rem'
  },
  formLabel: {
    ...Style.elements.sectionHeader,
    margin: '1rem 0 0.25rem'
  }
}
