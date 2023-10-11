import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h, h3, label, span } from 'react-hyperscript-helpers';
import { ButtonPrimary, ButtonSecondary, IdContainer, LabeledCheckbox } from 'src/components/common';
import { centeredSpinner } from 'src/components/icons';
import { TextInput } from 'src/components/input';
import planet from 'src/images/register-planet.svg';
import { Ajax } from 'src/libs/ajax';
import { refreshTerraProfile, signOut } from 'src/libs/auth';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import Events from 'src/libs/events';
import { FormLabel } from 'src/libs/forms';
import { registrationLogo } from 'src/libs/logos';
import { authStore, getTerraUser, TerraUser, TerraUserProfile } from 'src/libs/state';
import validate from 'validate.js';

const constraints = (partOfOrg) => {
  return {
    givenName: { presence: { allowEmpty: false } },
    familyName: { presence: { allowEmpty: false } },
    email: { presence: { allowEmpty: false } },
    institute: { presence: { allowEmpty: !partOfOrg } },
    department: { presence: { allowEmpty: !partOfOrg } },
    title: { presence: { allowEmpty: !partOfOrg } },
  };
};

const Register = () => {
  const user: TerraUser = getTerraUser();
  const profile: TerraUserProfile = authStore.get().profile;
  const [busy, setBusy] = useState(false);
  const [givenName, setGivenName] = useState(user.givenName || '');
  const [familyName, setFamilyName] = useState(user.familyName || '');
  const [email, setEmail] = useState(user.email || '');
  const [partOfOrganization, setPartOfOrganization] = useState(true);
  const [institute, setInstitute] = useState(profile.institute ?? ''); // keep this key as 'institute' to be backwards compatible with existing Thurloe KVs
  const [title, setTitle] = useState(profile.title ?? '');
  const [department, setDepartment] = useState(profile.department ?? '');
  const [interestInTerra, setInterestInTerra] = useState(profile.interestInTerra ?? '');

  const checkboxLine = (children) =>
    div(
      {
        style: {
          marginRight: '1rem',
        },
      },
      children
    );
  const interestInTerraCheckbox = (title) =>
    div({ style: { marginTop: '.25rem' } }, [
      h(
        LabeledCheckbox,
        {
          checked: _.includes(title, interestInTerra),
          onChange: (v) => {
            const interestsList = _.isEmpty(interestInTerra) ? [] : _.split(',', interestInTerra);
            const updatedInterestsList = v ? _.concat(interestsList, [title]) : _.without([title], interestsList);
            setInterestInTerra(_.join(',', updatedInterestsList));
          },
        },
        [
          span(
            {
              style: {
                marginLeft: '0.5rem',
              },
            },
            [title]
          ),
        ]
      ),
    ]);

  const register = async () => {
    try {
      setBusy(true);
      const orgFields = partOfOrganization
        ? {
            institute,
            department,
            title,
          }
        : {};
      await Ajax().User.profile.set({
        firstName: givenName,
        lastName: familyName,
        contactEmail: email,
        interestInTerra,
        ...orgFields,
      });
      authStore.update((state) => ({ ...state, registrationStatus: 'registeredWithoutTos' }));
      await refreshTerraProfile();
      Ajax().Metrics.captureEvent(Events.user.register);
    } catch (error) {
      reportError('Error registering', error);
      setBusy(false);
    }
  };
  const errors = validate(
    { givenName, familyName, email, institute, title, department },
    constraints(partOfOrganization)
  );
  return div(
    {
      role: 'main',
      style: {
        flexGrow: 1,
        padding: '5rem',
        backgroundImage: `url(${planet})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '750px',
        backgroundPosition: 'right 0px bottom -600px',
      },
    },
    [
      registrationLogo(),
      div(
        {
          style: {
            marginTop: '4rem',
            color: colors.dark(0.6),
            fontSize: '1.5rem',
            fontWeight: 500,
          },
        },
        ['New User Registration']
      ),
      div({ style: { marginTop: '1rem', display: 'flex' } }, [
        h(IdContainer, [
          (id) =>
            div({ style: { lineHeight: '170%' } }, [
              h(FormLabel, { htmlFor: id, required: true }, ['First Name']),
              h(TextInput, {
                id,
                style: { display: 'block' },
                value: givenName,
                onChange: (v) => setGivenName(v),
              }),
            ]),
        ]),
        div({ style: { width: '1rem' } }),
        h(IdContainer, [
          (id) =>
            div({ style: { lineHeight: '170%' } }, [
              h(FormLabel, { htmlFor: id, required: true }, ['Last Name']),
              h(TextInput, {
                id,
                style: { display: 'block' },
                value: familyName,
                onChange: (v) => setFamilyName(v),
              }),
            ]),
        ]),
      ]),
      h(IdContainer, [
        (id) =>
          div({ style: { lineHeight: '170%' } }, [
            h(FormLabel, { htmlFor: id, required: true, style: { display: 'block', marginTop: '2rem' } }, [
              'Contact Email for Notifications',
            ]),
            div([
              h(TextInput, {
                id,
                value: email,
                onChange: (v) => setEmail(v),
                style: { width: '66ex' },
              }),
            ]),
          ]),
      ]),
      h(IdContainer, [
        (id) =>
          div({ style: { lineHeight: '170%' } }, [
            h(
              FormLabel,
              { htmlFor: id, required: partOfOrganization, style: { display: 'block', marginTop: '2rem' } },
              ['Organization']
            ),
            div([
              h(TextInput, {
                id,
                value: institute,
                onChange: (v) => setInstitute(v),
                disabled: !partOfOrganization,
                style: { width: '66ex' },
              }),
            ]),
          ]),
      ]),
      div({ style: { lineHeight: '170%', marginTop: '0.25rem' } }, [
        h(
          LabeledCheckbox,
          {
            checked: !partOfOrganization,
            onChange: () => setPartOfOrganization(!partOfOrganization),
          },
          [label({ style: { marginLeft: '0.25rem' } }, ['I am not a part of an organization'])]
        ),
      ]),
      div({ style: { display: 'flex' } }, [
        h(IdContainer, [
          (id) =>
            div({ style: { lineHeight: '170%' } }, [
              h(FormLabel, { htmlFor: id, required: partOfOrganization, style: { display: 'block' } }, ['Department']),
              div([
                h(TextInput, {
                  id,
                  value: department,
                  onChange: (v) => setDepartment(v),
                  disabled: !partOfOrganization,
                }),
              ]),
            ]),
        ]),
        div({ style: { width: '1rem' } }),
        h(IdContainer, [
          (id) =>
            div({ style: { lineHeight: '170%' } }, [
              h(FormLabel, { htmlFor: id, required: partOfOrganization, style: { display: 'block' } }, ['Title']),
              div([
                h(TextInput, {
                  id,
                  value: title,
                  onChange: (v) => setTitle(v),
                  disabled: !partOfOrganization,
                }),
              ]),
            ]),
        ]),
      ]),
      h3({ style: { marginTop: '2rem' } }, ['I am most interested in using Terra to (Check all that apply):']),
      checkboxLine([
        interestInTerraCheckbox('Collaborate with individuals within my organization'),
        interestInTerraCheckbox('Collaborate with individuals outside of my organization'),
        interestInTerraCheckbox('Access data'),
        interestInTerraCheckbox('Manage datasets'),
        interestInTerraCheckbox('Launch workflows'),
        interestInTerraCheckbox('Complete interactive analyses'),
        interestInTerraCheckbox('Build Tools'),
      ]),
      div({ style: { marginTop: '3rem' } }, [
        h(ButtonPrimary, { disabled: errors || busy, onClick: register }, ['Register']),
        h(ButtonSecondary, { style: { marginLeft: '1rem' }, onClick: () => signOut('requested') }, ['Cancel']),
        busy &&
          centeredSpinner({
            size: 34,
            ...{ style: { display: undefined, margin: undefined, marginLeft: '1ex' } },
          }),
      ]),
    ]
  );
};

export default Register;
