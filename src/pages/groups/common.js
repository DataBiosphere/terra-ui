import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'


export const styles = {
  cardContainer: {
    position: 'relative',
    marginTop: '1rem',
    display: 'flex', flexWrap: 'wrap'
  },
  shortCreateCard: {
    ...Style.elements.card.container,
    justifyContent: 'center',
    width: 180, height: 100,
    margin: '0.25rem 1rem 0 0',
    color: colors.green[0], fontSize: 18, lineHeight: '22px'
  },
  longCard: {
    ...Style.elements.card.container,
    alignItems: 'center', flexDirection: undefined,
    width: '100%', minWidth: 0,
    margin: '0.25rem 0.5rem 0.5rem 0',
    fontSize: 13
  },
  longTitle: {
    ...Style.elements.card.title,
    whiteSpace: 'nowrap', textOverflow: 'ellipsis'
  },
  toolbarContainer: {
    flex: 'none', display: 'flex', alignItems: 'flex-end'
  }
}
