import _ from 'lodash/fp';
import pluralize from 'pluralize';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, ButtonSecondary, IdContainer, RadioButton } from 'src/components/common';
import DataTable from 'src/components/data/DataTable';
import { icon } from 'src/components/icons';
import { ValidatedInput } from 'src/components/input';
import Modal from 'src/components/Modal';
import { EntityServiceDataTableProvider } from 'src/libs/ajax/data-table-providers/EntityServiceDataTableProvider';
import { FormLabel } from 'src/libs/forms';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { chooseBaseType, chooseRootType, chooseSetType } from 'src/pages/workspaces/workspace/workflows/EntitySelectionType';
import validate from 'validate.js';

function DataStepContent({ entitySelectionModel, onDismiss, onSuccess, entityMetadata, rootEntityType, workspace }) {
  const {
    workspace: { namespace, name, googleProject },
  } = workspace;
  // State
  const [type, setType] = useState(entitySelectionModel.type);
  const [selectedEntities, setSelectedEntities] = useState(entitySelectionModel.selectedEntities);
  const [newSetName, setNewSetName] = useState(entitySelectionModel.newSetName);

  // Helpers
  const makeModelResetFunction = (newType) => () => {
    setType(newType);
    setSelectedEntities({});
  };

  const willCreateSet = type === chooseBaseType || _.size(selectedEntities) > 1;

  // Render
  const isSet = _.endsWith('_set', rootEntityType);
  const entitySetType = `${rootEntityType}_set`;
  const hasSet = _.has(entitySetType, entityMetadata);
  const hasEntityType = _.has(rootEntityType, entityMetadata);
  const baseEntityType = isSet ? rootEntityType.slice(0, -4) : rootEntityType;

  const errors = validate(
    { newSetName },
    {
      newSetName: {
        presence: { allowEmpty: false },
        format: {
          pattern: /^[A-Za-z0-9_\-.]*$/,
          message: 'can only contain letters, numbers, underscores, dashes, and periods',
        },
      },
    }
  );

  return h(
    Modal,
    {
      title: 'Select Data',
      okButton: h(
        ButtonPrimary,
        {
          tooltip: _.isEmpty(selectedEntities) ? 'Please select data' : undefined,
          disabled: !!errors || _.isEmpty(selectedEntities) || (!newSetName && willCreateSet),
          onClick: () => onSuccess({ type, selectedEntities, newSetName }),
        },
        'OK'
      ),
      onDismiss,
      width: 'calc(100% - 2rem)',
    },
    [
      div({ style: { padding: '1rem 0.5rem', lineHeight: '1.5rem' } }, [
        div({ role: 'radiogroup', 'aria-label': 'Select entities' }, [
          isSet &&
            div([
              h(RadioButton, {
                text: `Create a new ${rootEntityType} from selected ${baseEntityType}s`,
                name: 'select-data',
                checked: type === chooseBaseType,
                onChange: makeModelResetFunction(chooseBaseType),
                labelStyle: { marginLeft: '0.75rem' },
              }),
            ]),
          hasEntityType &&
            div([
              h(RadioButton, {
                text: `Choose specific ${rootEntityType}s to process`,
                name: 'select-data',
                checked: type === chooseRootType,
                onChange: makeModelResetFunction(chooseRootType),
                labelStyle: { marginLeft: '0.75rem' },
              }),
            ]),
          hasSet &&
            div([
              h(RadioButton, {
                text: `Choose existing sets of ${rootEntityType}s`,
                name: 'select-data',
                checked: type === chooseSetType,
                onChange: makeModelResetFunction(chooseSetType),
                labelStyle: { marginLeft: '0.75rem' },
              }),
            ]),
        ]),
        div(
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              height: 500,
              marginTop: '1rem',
            },
          },
          [
            h(DataTable, {
              dataProvider: new EntityServiceDataTableProvider(namespace, name),
              key: type.description,
              childrenBefore: ({ showColumnSettingsModal }) =>
                div({ style: { display: 'flex', alignItems: 'center' } }, [
                  div({ style: Style.elements.sectionHeader }, [
                    Utils.switchCase(
                      type,
                      [chooseSetType, () => `Select one or more ${entitySetType}s to combine and process`],
                      [chooseRootType, () => `Select ${rootEntityType}s to process`],
                      [chooseBaseType, () => `Select ${baseEntityType}s to create a new ${rootEntityType} to process`]
                    ),
                  ]),
                  h(
                    ButtonSecondary,
                    {
                      style: { marginLeft: '1.5rem' },
                      onClick: showColumnSettingsModal,
                    },
                    [icon('cog', { style: { marginRight: '0.5rem' } }), 'Settings']
                  ),
                  div({ style: { margin: '0 1.5rem', height: '100%', borderLeft: Style.standardLine } }),
                  div(
                    {
                      role: 'status',
                      'aria-atomic': true,
                    },
                    [`${pluralize('row', _.size(selectedEntities), true)} selected`]
                  ),
                ]),
              entityType: Utils.switchCase(
                type,
                [chooseBaseType, () => baseEntityType],
                [chooseRootType, () => rootEntityType],
                [chooseSetType, () => entitySetType]
              ),
              entityMetadata,
              setEntityMetadata: () => {},
              googleProject,
              workspaceId: { namespace, name },
              workspace,
              selectionModel: {
                selected: selectedEntities,
                setSelected: setSelectedEntities,
              },
            }),
          ]
        ),
        willCreateSet &&
          h(IdContainer, [
            (id) =>
              div({ style: { marginTop: '1rem' } }, [
                h(FormLabel, { htmlFor: id }, [
                  Utils.switchCase(
                    type,
                    [chooseSetType, () => `Selected ${entitySetType}s will have their membership combined into a new ${entitySetType} named:`],
                    [chooseBaseType, () => `Selected ${baseEntityType}s will be saved as a new ${rootEntityType} named:`],
                    [chooseRootType, () => `Selected ${rootEntityType}s will be saved as a new ${entitySetType} named:`]
                  ),
                ]),
                h(ValidatedInput, {
                  inputProps: {
                    id,
                    value: newSetName,
                    style: { marginLeft: '0.25rem' },
                    onChange: setNewSetName,
                  },
                  width: 500,
                  error: Utils.summarizeErrors(errors?.newSetName),
                }),
              ]),
          ]),
      ]),
    ]
  );
}

DataStepContent.propTypes = {
  entityMetadata: PropTypes.objectOf(
    PropTypes.shape({
      count: PropTypes.number.isRequired,
    })
  ).isRequired,
  entitySelectionModel: PropTypes.shape({
    newSetName: PropTypes.string.isRequired,
    selectedElements: PropTypes.array,
    type: PropTypes.oneOf([chooseSetType, chooseRootType, chooseBaseType]),
  }),
  onDismiss: PropTypes.func,
  onSuccess: PropTypes.func,
  rootEntityType: PropTypes.string,
};

export default DataStepContent;
