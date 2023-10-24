import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h, h3, label, p, span } from 'react-hyperscript-helpers';
import { ButtonPrimary, IdContainer, LabeledCheckbox, Link } from 'src/components/common';
import { InfoBox } from 'src/components/InfoBox';
import { TextInput, ValidatedInput } from 'src/components/input';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import ProfilePicture from 'src/components/ProfilePicture';
import { Ajax } from 'src/libs/ajax';
import { makeSetUserProfileRequest } from 'src/libs/ajax/User';
import { refreshTerraProfile } from 'src/libs/auth';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { authStore, getTerraUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import validate from 'validate.js';

const styles = {
  page: {
    width: 1050,
  },
  sectionHeading: {
    margin: '2rem 0 1rem',
    color: colors.dark(),
    fontSize: 16,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  header: {
    line: {
      display: 'flex',
      alignItems: 'center',
    },
    nameLine: {
      marginLeft: '1rem',
      color: colors.dark(),
      fontSize: '150%',
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
      whiteSpace: 'nowrap',
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

export const PersonalInfo = ({ setSaving }) => {
  const [profileInfo, setProfileInfo] = useState(() => _.mapValues((v) => (v === 'N/A' ? '' : v), authStore.get().profile));
  const [proxyGroup, setProxyGroup] = useState();
  const { researchArea } = profileInfo;

  const signal = useCancellation();

  // Helpers
  const assignValue = _.curry((key, value) => {
    setProfileInfo(_.set(key, value));
  });
  const line = (children) => div({ style: styles.form.line }, children);
  const checkboxLine = (children) => div({ style: styles.form.container }, children);
  const textField = (key, title, { placeholder, required } = {}) =>
    h(IdContainer, [
      (id) =>
        div({ style: styles.form.container }, [
          label({ htmlFor: id, style: styles.form.title }, [title]),
          required
            ? h(ValidatedInput, {
                inputProps: {
                  id,
                  value: profileInfo[key],
                  onChange: assignValue(key),
                  placeholder: placeholder || 'Required',
                },
                error: Utils.summarizeErrors(errors && errors[key]),
              })
            : h(TextInput, {
                id,
                value: profileInfo[key],
                onChange: assignValue(key),
                placeholder,
              }),
        ]),
    ]);
  const researchAreaCheckbox = (title) =>
    div([
      h(
        LabeledCheckbox,
        {
          checked: _.includes(title, researchArea),
          onChange: (v) => {
            const areasOfResearchList = _.isEmpty(researchArea) ? [] : _.split(',', researchArea);
            const updatedAreasOfResearchList = v ? _.concat(areasOfResearchList, [title]) : _.without([title], areasOfResearchList);
            assignValue('researchArea', _.join(',', updatedAreasOfResearchList));
          },
        },
        [span({ style: styles.form.checkboxLabel }, [title])]
      ),
    ]);
  // Lifecycle
  useOnMount(() => {
    const loadProxyGroup = async () => {
      setProxyGroup(await Ajax(signal).User.getProxyGroup(authStore.get().profile.email));
    };
    loadProxyGroup();
  });
  // Render
  const { firstName, lastName } = profileInfo;
  const required = { presence: { allowEmpty: false } };
  const errors = validate({ firstName, lastName }, { firstName: required, lastName: required });

  return h(PageBox, { role: 'main', style: { flexGrow: 1 }, variant: PageBoxVariants.light }, [
    div({ style: styles.header.line }, [
      div({ style: { position: 'relative' } }, [
        h(ProfilePicture, { size: 48 }),
        h(InfoBox, { style: { alignSelf: 'flex-end' } }, [
          'To change your profile image, visit your ',
          h(
            Link,
            {
              href: `https://myaccount.google.com?authuser=${getTerraUser().email}`,
              ...Utils.newTabLinkProps,
            },
            ['Google account page.']
          ),
        ]),
      ]),
      div({ style: styles.header.nameLine }, [`Hello again, ${firstName}`]),
    ]),
    div({ style: { display: 'flex' } }, [
      div({ style: styles.page }, [
        line([textField('firstName', 'First Name', { required: true }), textField('lastName', 'Last Name', { required: true })]),
        line([
          textField('institute', 'Organization'), // keep this key as 'institute' to be backwards compatible with existing Thurloe KVs
          textField('title', 'Title'),
          textField('department', 'Department'),
        ]),
        line([textField('programLocationCity', 'City'), textField('programLocationState', 'State'), textField('programLocationCountry', 'Country')]),
        line([
          div({ style: styles.form.container }, [
            div({ style: styles.form.title }, ['Email']),
            div({ style: { margin: '0.5rem', width: 320 } }, [profileInfo.email]),
          ]),
          textField('contactEmail', 'Contact Email for Notifications (if different)', { placeholder: profileInfo.email }),
        ]),

        line([
          div({ style: styles.form.container }, [
            div({ style: styles.form.title }, [
              span({ style: { marginRight: '0.5rem' } }, ['Proxy Group']),
              h(InfoBox, [
                'For more information about proxy groups, see the ',
                h(
                  Link,
                  {
                    href: 'https://support.terra.bio/hc/en-us/articles/360031023592',
                    ...Utils.newTabLinkProps,
                  },
                  ['user guide.']
                ),
              ]),
            ]),
            div({ style: { margin: '1rem' } }, proxyGroup || 'Loading...'),
          ]),
        ]),

        h3({ style: styles.sectionHeading }, ['What is your area of research?']),

        p('Check all that apply.'),

        div({ style: { marginBottom: '1rem', display: 'flex', justifyContent: 'normal' } }, [
          checkboxLine([
            researchAreaCheckbox('Cancer'),
            researchAreaCheckbox('Cardiovascular disease'),
            researchAreaCheckbox('Epidemiology'),
            researchAreaCheckbox('Epigenetics'),
          ]),
          checkboxLine([
            researchAreaCheckbox('Immunology'),
            researchAreaCheckbox('Infectious disease and microbiome'),
            researchAreaCheckbox('Medical and Population Genetics'),
            researchAreaCheckbox('Psychiatric disease'),
          ]),
          checkboxLine([researchAreaCheckbox('Rare Disease'), researchAreaCheckbox('Single Cell Genomics'), researchAreaCheckbox('Agricultural')]),
        ]),

        h(
          ButtonPrimary,
          {
            onClick: _.flow(
              Utils.withBusyState(setSaving),
              withErrorReporting('Error saving profile')
            )(async () => {
              await Ajax().User.profile.set(makeSetUserProfileRequest(profileInfo));
              await refreshTerraProfile();
            }),
            disabled: !!errors,
            tooltip: !!errors && 'Please fill out all required fields',
          },
          ['Save Profile']
        ),
      ]),
    ]),
  ]);
};
