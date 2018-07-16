import * as Style from 'src/libs/style'


export const styles = {
  cardContainer: {
    position: 'relative',
    padding: '0 4rem',
    display: 'flex', flexWrap: 'wrap'
  },
  shortCreateCard: {
    ...Style.elements.card,
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    width: 180, height: 100,
    margin: '0.25rem 0.5rem',
    color: Style.colors.secondary, fontSize: 18, lineHeight: '22px'
  },
  longCard: {
    ...Style.elements.card,
    display: 'flex', alignItems: 'center',
    width: '100%', minWidth: 0,
    margin: '0.25rem 0.5rem',
    fontSize: 13
  },
  longTitle: {
    fontSize: 16,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  toolbarContainer: {
    flex: 'none', display: 'flex', alignItems: 'flex-end',
    margin: '1rem 4.5rem 2rem'
  },
  toolbarButtons: {
    marginLeft: 'auto', display: 'flex',
    backgroundColor: 'white', borderRadius: 3
  },
  toolbarButton: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '2.25rem', width: '3rem',
    color: Style.colors.secondary
  },
  formLabel: {
    ...Style.elements.sectionHeader,
    margin: '1rem 0 0.25rem'
  }
}
