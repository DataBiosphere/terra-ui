import colors from 'src/libs/colors'


export const styles = {
  toolbarContainer: {
    flex: 'none', display: 'flex', alignItems: 'flex-end',
    color: colors.blue[0], // probably not necessary
    margin: '1rem 4.5rem'
  },
  toolbarButton: active => ({
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    borderRadius: 3, border: `1px solid ${colors.blue[0]}`, // coloring probably not necessary
    height: '2.25rem', padding: '0 .75rem',
    color: colors.blue[0],
    backgroundColor: active ? colors.blue[4] : 'white',
    fontWeight: active? 'bold' : 'normal'
  })
}
