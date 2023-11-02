import colors from 'src/libs/colors';

export const linkStyles = {
  idLink: {
    container: {
      display: 'grid',
      marginBottom: '0.6rem',
      border: `1px solid ${colors.dark(0.55)}`,
      borderRadius: 4,
    },
    linkContentTop: (hasBottom) => ({
      display: 'grid',
      rowGap: '0.6rem',
      backgroundColor: colors.light(0.2),
      padding: '1.2rem',
      borderRadius: hasBottom ? '4px 4px 0 0' : 4,
    }),
    linkContentBottom: {
      padding: '1.2rem',
    },
    linkName: {
      fontSize: 18,
      fontWeight: 700,
      marginBottom: '0.6rem',
      display: 'inline',
    },
    linkDetailLabel: {
      fontWeight: 700,
      marginBottom: '0.6rem',
      marginRight: '1.2rem',
    },
  },
  form: {
    line: {
      display: 'flex',
      justifyContent: 'normal',
      margin: '2rem 0',
    },
    container: {
      width: 320,
      marginRight: '1rem',
    },
    title: {
      whitespace: 'nowrap',
      fontSize: 16,
      marginBottom: '0.3rem',
    },
    checkboxLine: {
      margin: '0.75rem 0',
    },
    checkboxLabel: {
      marginLeft: '0.5rem',
    },
  },
};
