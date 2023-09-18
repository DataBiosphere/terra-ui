import { Fragment, useCallback, useEffect, useState } from 'react';
import { div, fieldset, form, h, h1, input, label, p, span } from 'react-hyperscript-helpers';
import { ButtonOutline, ButtonPrimary, Checkbox, Select } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TextArea, ValidatedInput } from 'src/components/input';
import planet from 'src/images/register-planet.svg';
import { ReactComponent as TerraOnAzureLogo } from 'src/images/terra-ms-logo.svg';
import { Ajax } from 'src/libs/ajax';
import { signOut } from 'src/libs/auth';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import { FormLabel, FormLegend } from 'src/libs/forms';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { useStore } from 'src/libs/react-utils';
import { authStore, azurePreviewStore, getUser } from 'src/libs/state';

const styles = {
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 1.5,
    maxWidth: 760,
  },
  header: {
    display: 'flex',
    marginTop: '3rem',
    marginBotton: '2rem',
    color: colors.dark(0.8),
    fontSize: '1.8rem',
    fontWeight: 500,
  },
  button: {
    textTransform: 'none',
  },
};

const AzurePreviewForPreviewUser = () => {
  const dismiss = () => {
    azurePreviewStore.set(true);
  };

  return h(Fragment, [
    p({ style: styles.paragraph }, ['This is a preview version of the Terra platform on Microsoft Azure.']),

    div({ style: { marginTop: '1.5rem' } }, [
      h(ButtonPrimary, { onClick: dismiss, style: styles.button }, ['Proceed to Terra on Microsoft Azure Preview']),
    ]),
    div({ style: { marginTop: '1rem' } }, [h(ButtonOutline, { onClick: () => signOut('requested'), style: styles.button }, ['Sign Out'])]),
  ]);
};


const AzurePreview = () => {
  return div(
    {
      role: 'main',
      style: {
        ...styles.centered,
        flexGrow: 1,
        padding: '5rem',
        backgroundImage: `url(${planet})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '750px',
        backgroundPosition: 'right 0px bottom -600px',
      },
    },
    [
      div([
        h(TerraOnAzureLogo, { title: 'Terra on Microsoft Azure - Preview', role: 'img' }),
        h1({ style: styles.header }, ['Terra on Microsoft Azure - Preview']),
        h(AzurePreviewForPreviewUser),
      ]),
    ]
  );
};

export default AzurePreview;

export const navPaths = [
  {
    name: 'azure-preview',
    path: '/azure-preview',
    component: AzurePreview,
    public: true,
    title: 'Terra on Microsoft Azure Preview',
  },
];
