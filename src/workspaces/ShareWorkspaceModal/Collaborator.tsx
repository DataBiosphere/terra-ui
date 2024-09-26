import { Icon } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { Dispatch, SetStateAction } from 'react';
import { LabeledCheckbox, Link, Select, SelectProps } from 'src/components/common';
import { getPopupRoot } from 'src/components/popup-utils';
import colors from 'src/libs/colors';
import { getTerraUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { AccessEntry, WorkspaceAcl } from 'src/workspaces/acl-utils';
import { BaseWorkspace, canWrite, hasAccessLevel, isAzureWorkspace, WorkspaceAccessLevel } from 'src/workspaces/utils';

/**
 * @param aclItem {AccessEntry} the item to render
 * @param acl {WorkspaceAcl} the entire current Access Control List
 * @param setAcl {Dispatch<SetStateAction<WorkspaceAcl>>} called to modify the Access Control list when the aclItem changes or is removed
 * @param originalAcl {WorkspaceAcl} the original acl, to determine new items
 * @param workspace {BaseWorkspace} the workspace the acl belongs to
 * @param lastAddedEmail {string | undefined}  the most recently added email to the list
 */
interface CollaboratorProps {
  aclItem: AccessEntry;
  acl: WorkspaceAcl;
  setAcl: Dispatch<SetStateAction<WorkspaceAcl>>;
  originalAcl: WorkspaceAcl;
  workspace: BaseWorkspace;
  lastAddedEmail?: string;
}

export const Collaborator: React.FC<CollaboratorProps> = (props: CollaboratorProps) => {
  const { originalAcl, aclItem, acl, setAcl, workspace, lastAddedEmail } = props;
  const { email, accessLevel, pending } = aclItem;
  const POAccessLevel: WorkspaceAccessLevel = 'PROJECT_OWNER';
  const disabled = accessLevel === POAccessLevel || email === getTerraUser().email;
  const isOld = _.find({ email }, originalAcl);

  return (
    <div
      role='listitem'
      style={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: 5,
        padding: '0.5rem 0.75rem',
        marginBottom: 10,
        border: isOld ? `1px solid ${colors.dark(0.25)}` : `2px dashed ${colors.success(0.5)}`,
        backgroundColor: isOld ? colors.light(0.2) : colors.success(0.05),
      }}
    >
      <div style={{ flex: 1 }}>
        {email}
        {pending && <div style={styles}>Pending</div>}
        <AclInput
          aria-label={`permissions for ${email}`}
          autoFocus={email === lastAddedEmail}
          value={aclItem}
          onChange={(v) => setAcl(_.map((entry) => (entry.email === email ? v : entry), acl))}
          disabled={disabled}
          maxAccessLevel={workspace.accessLevel}
          isAzureWorkspace={isAzureWorkspace(workspace)}
        />
      </div>
      {!disabled && (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <Link
          tooltip='Remove'
          onClick={() => {
            const newAcl = _.remove({ email }, acl);
            setAcl(newAcl);
          }}
        >
          <Icon icon='times' size={20} style={{ marginRight: '0.5rem' }} />
        </Link>
      )}
    </div>
  );
};

const AclSelect = Select as typeof Select<WorkspaceAccessLevel>;
type AclSelectProps = Omit<
  SelectProps<WorkspaceAccessLevel, false, { value: WorkspaceAccessLevel; label: string | undefined }>,
  'value' | 'onChange' | 'options'
>;

interface AclInputProps extends AclSelectProps {
  value: AccessEntry;
  maxAccessLevel: WorkspaceAccessLevel;
  isAzureWorkspace: boolean | undefined;
  disabled: boolean | undefined;
  onChange: (AccessEntry) => void;
}

export const AclInput: React.FC<AclInputProps> = (props: AclInputProps) => {
  const { value, onChange, disabled, maxAccessLevel, isAzureWorkspace, autoFocus, ...rest } = props;
  const { accessLevel, canShare, canCompute } = value;
  const userCanShareAdditionalPerms = ['OWNER', 'PROJECT_OWNER'].includes(maxAccessLevel);
  const tooltipProps = userCanShareAdditionalPerms
    ? {}
    : { tooltip: 'Only Owners and Project Owners can share additional permissions' };

  return (
    <div style={{ display: 'flex', marginTop: '0.25rem' }}>
      <div style={{ width: isAzureWorkspace ? 425 : 200 }}>
        <AclSelect
          autoFocus={autoFocus}
          isSearchable={false}
          isDisabled={disabled}
          getOptionLabel={(o) => Utils.normalizeLabel(o.value)}
          isOptionDisabled={(o) => !hasAccessLevel(o.value, maxAccessLevel)}
          value={accessLevel}
          onChange={(o) =>
            onChange({
              ...value,
              accessLevel: o?.value,
              ...Utils.switchCase(
                o?.value,
                ['READER', () => ({ canCompute: false, canShare: false })],
                ['WRITER', () => ({ canCompute: hasAccessLevel('OWNER', maxAccessLevel), canShare: false })],
                ['OWNER', () => ({ canCompute: true, canShare: true })]
              ),
            })
          }
          options={accessLevel === 'PROJECT_OWNER' ? ['PROJECT_OWNER'] : ['READER', 'WRITER', 'OWNER']}
          menuPortalTarget={getPopupRoot()}
          {...rest}
        />
      </div>
      {!isAzureWorkspace && (
        <div style={{ marginLeft: '1rem' }}>
          <div style={{ marginBottom: '0.2rem' }}>
            <LabeledCheckbox
              disabled={disabled || !userCanShareAdditionalPerms}
              checked={canShare}
              onChange={() => onChange(_.update('canShare', (b) => !b, value))}
              {...tooltipProps}
            >
              Can share
            </LabeledCheckbox>
          </div>
          <div>
            {canWrite(accessLevel) && (
              <LabeledCheckbox
                disabled={disabled || !userCanShareAdditionalPerms}
                checked={canCompute}
                onChange={() => onChange(_.update('canCompute', (b) => !b, value))}
                {...tooltipProps}
              >
                Can compute
              </LabeledCheckbox>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: React.CSSProperties = {
  textTransform: 'uppercase',
  fontWeight: 500,
  color: colors.warning(),
};
