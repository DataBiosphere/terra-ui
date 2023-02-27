import colors from 'src/libs/colors'


export const computeStyles: Record<string, React.CSSProperties> = {
  label: { fontWeight: 600, whiteSpace: 'pre' },
  value: { fontWeight: 400, whiteSpace: 'pre' },
  titleBar: { marginBottom: '1rem' },
  whiteBoxContainer: { padding: '1rem', borderRadius: 3, backgroundColor: 'white' },
  drawerContent: { display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem' },
  headerText: { fontSize: 16, fontWeight: 600 },
  warningView: { backgroundColor: colors.warning(0.1) }
}
