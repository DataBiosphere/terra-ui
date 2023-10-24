import _ from 'lodash/fp';
import { CSSProperties, ReactNode, useEffect, useState } from 'react';
import { div, h, h3, label, p, span } from 'react-hyperscript-helpers';
import { ButtonPrimary, IdContainer, LabeledCheckbox, Link } from 'src/components/common';
import { InfoBox } from 'src/components/InfoBox';
import { TextInput, ValidatedInput } from 'src/components/input';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import ProfilePicture from 'src/components/ProfilePicture';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { useCancellation } from 'src/libs/react-utils';
import { authStore, getTerraUser, TerraUserProfile } from 'src/libs/state';
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
} as const satisfies {
  page: CSSProperties;
  sectionHeading: CSSProperties;
  header: Record<string, CSSProperties>;
  form: Record<string, CSSProperties>;
};

export interface PersonalInfoProps {
  initialProfile: TerraUserProfile;
  onSave: (newProfile: TerraUserProfile) => void;
}

export const PersonalInfo = (props: PersonalInfoProps): ReactNode => {
  const { initialProfile, onSave } = props;

  const [profileInfo, setProfileInfo] = useState<TerraUserProfile>(
    () => _.mapValues((v) => (v === 'N/A' ? '' : v), initialProfile) as TerraUserProfile
  );
  const [proxyGroup, setProxyGroup] = useState<string>();
  const { researchArea } = profileInfo;

  const signal = useCancellation();

  // Helpers
  const assignValue = _.curry((key: string, value: string | undefined) => {
    setProfileInfo(_.set(key, value));
  });
  const line = (children: ReactNode[]) => div({ style: styles.form.line }, children);
  const checkboxLine = (children: ReactNode[]) => div({ style: styles.form.container }, children);
  const textField = (
    key: keyof TerraUserProfile,
    title: string,
    { placeholder, required }: { placeholder?: string; required?: boolean } = {}
  ) =>
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
  const researchAreaCheckbox = (title: string) =>
    div([
      h(
        LabeledCheckbox,
        {
          checked: _.includes(title, researchArea),
          onChange: (v) => {
            const areasOfResearchList = _.isEmpty(researchArea) ? [] : _.split(',', researchArea);
            const updatedAreasOfResearchList = v
              ? _.concat(areasOfResearchList, [title])
              : _.without([title], areasOfResearchList);
            assignValue('researchArea', _.join(',', updatedAreasOfResearchList));
          },
        },
        [span({ style: styles.form.checkboxLabel }, [title])]
      ),
    ]);

  // Lifecycle
  const userEmail = authStore.get().profile.email;
  useEffect(() => {
    if (userEmail) {
      Ajax(signal).User.getProxyGroup(userEmail).then(setProxyGroup);
    }
  }, [signal, userEmail]);
  // Render
  const { firstName, lastName } = profileInfo;
  const required = { presence: { allowEmpty: false } };
  const errors = validate({ firstName, lastName }, { firstName: required, lastName: required });

  return h(PageBox, { role: 'main', style: { flexGrow: 1 }, variant: PageBoxVariants.light }, [
    div({ style: styles.header.line }, [
      div({ style: { position: 'relative' } }, [
        // @ts-expect-error
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
        line([
          textField('firstName', 'First Name', { required: true }),
          textField('lastName', 'Last Name', { required: true }),
        ]),
        line([
          textField('institute', 'Organization'), // keep this key as 'institute' to be backwards compatible with existing Thurloe KVs
          textField('title', 'Title'),
          textField('department', 'Department'),
        ]),
        line([
          textField('programLocationCity', 'City'),
          textField('programLocationState', 'State'),
          textField('programLocationCountry', 'Country'),
        ]),
        line([
          div({ style: styles.form.container }, [
            div({ style: styles.form.title }, ['Email']),
            div({ style: { margin: '0.5rem', width: 320 } }, [profileInfo.email]),
          ]),
          textField('contactEmail', 'Contact Email for Notifications (if different)', {
            placeholder: profileInfo.email,
          }),
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
            div({ style: { margin: '1rem' } }, [proxyGroup || 'Loading...']),
          ]),
        ]),

        h3({ style: styles.sectionHeading }, ['What is your area of research?']),

        p(['Check all that apply.']),

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
          checkboxLine([
            researchAreaCheckbox('Rare Disease'),
            researchAreaCheckbox('Single Cell Genomics'),
            researchAreaCheckbox('Agricultural'),
          ]),
        ]),

        h(
          ButtonPrimary,
          {
            onClick: () => {
              onSave(profileInfo);
            },
            disabled: !!errors,
            tooltip: !!errors && 'Please fill out all required fields',
          },
          ['Save Profile']
        ),
      ]),
    ]),
  ]);
};
