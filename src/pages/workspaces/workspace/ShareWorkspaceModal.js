import _ from "lodash/fp";
import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { div, h, h2, label, p, span } from "react-hyperscript-helpers";
import { ButtonPrimary, ButtonSecondary, IdContainer, LabeledCheckbox, Link, Select, spinnerOverlay, Switch } from "src/components/common";
import { centeredSpinner, icon } from "src/components/icons";
import { AutocompleteTextInput } from "src/components/input";
import Modal, { styles as modalStyles } from "src/components/Modal";
import { getPopupRoot } from "src/components/popup-utils";
import TooltipTrigger from "src/components/TooltipTrigger";
import { Ajax } from "src/libs/ajax";
import colors from "src/libs/colors";
import { reportError } from "src/libs/error";
import Events, { extractWorkspaceDetails } from "src/libs/events";
import { FormLabel } from "src/libs/forms";
import { useCancellation, useOnMount } from "src/libs/react-utils";
import { getUser } from "src/libs/state";
import * as Style from "src/libs/style";
import * as Utils from "src/libs/utils";
import { isAzureWorkspace } from "src/libs/workspace-utils";
import validate from "validate.js";

const terraSupportEmail = "Terra-Support@firecloud.org";

const styles = {
  currentCollaboratorsArea: {
    margin: "0.5rem -1.25rem 0",
    padding: "1rem 1.25rem",
    maxHeight: 550,
    overflowY: "auto",
    borderBottom: Style.standardLine,
    borderTop: Style.standardLine,
  },
  pending: {
    textTransform: "uppercase",
    fontWeight: 500,
    color: colors.warning(),
  },
};

const AclInput = ({ value, onChange, disabled, maxAccessLevel, isAzureWorkspace, autoFocus, ...props }) => {
  const { accessLevel, canShare, canCompute } = value;
  return div({ style: { display: "flex", marginTop: "0.25rem" } }, [
    div({ style: { width: isAzureWorkspace ? 425 : 200 } }, [
      h(Select, {
        autoFocus,
        isSearchable: false,
        isDisabled: disabled,
        getOptionLabel: (o) => Utils.normalizeLabel(o.value),
        isOptionDisabled: (o) => !Utils.hasAccessLevel(o.value, maxAccessLevel),
        value: accessLevel,
        onChange: (o) =>
          onChange({
            ...value,
            accessLevel: o.value,
            ...Utils.switchCase(
              o.value,
              ["READER", () => ({ canCompute: false, canShare: false })],
              ["WRITER", () => ({ canCompute: !isAzureWorkspace, canShare: false })],
              ["OWNER", () => ({ canCompute: true, canShare: true })]
            ),
          }),
        options: accessLevel === "PROJECT_OWNER" ? ["PROJECT_OWNER"] : ["READER", "WRITER", "OWNER"],
        menuPortalTarget: getPopupRoot(),
        ...props,
      }),
    ]),
    !isAzureWorkspace &&
      div({ style: { marginLeft: "1rem" } }, [
        div({ style: { marginBottom: "0.2rem" } }, [
          h(
            LabeledCheckbox,
            {
              disabled: disabled || accessLevel === "OWNER",
              checked: canShare,
              onChange: () => onChange(_.update("canShare", (b) => !b, value)),
            },
            [" Can share"]
          ),
        ]),
        div([
          h(
            LabeledCheckbox,
            {
              disabled: disabled || accessLevel !== "WRITER",
              checked: canCompute,
              onChange: () => onChange(_.update("canCompute", (b) => !b, value)),
            },
            [" Can compute"]
          ),
        ]),
      ]),
  ]);
};

const ShareWorkspaceModal = ({
  onDismiss,
  workspace,
  workspace: {
    workspace: { namespace, name },
  },
}) => {
  // State
  const [shareSuggestions, setShareSuggestions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [originalAcl, setOriginalAcl] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [acl, setAcl] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [working, setWorking] = useState(false);
  const [updateError, setUpdateError] = useState(undefined);
  const [lastAddedEmail, setLastAddedEmail] = useState(undefined);
  const [searchHasFocus, setSearchHasFocus] = useState(true);

  const list = useRef();
  const signal = useCancellation();

  // Helpers
  const renderCollaborator = ([index, aclItem]) => {
    const { email, accessLevel, pending } = aclItem;
    const POAccessLevel = "PROJECT_OWNER";
    const disabled = accessLevel === POAccessLevel || email === getUser().email;
    const isOld = _.find({ email }, originalAcl);

    return div(
      {
        role: "listitem",
        style: {
          display: "flex",
          alignItems: "center",
          borderRadius: 5,
          padding: "0.5rem 0.75rem",
          marginBottom: 10,
          border: isOld ? `1px solid ${colors.dark(0.25)}` : ` 2px dashed ${colors.success(0.5)}`,
          backgroundColor: isOld ? colors.light(0.2) : colors.success(0.05),
        },
      },
      [
        div({ style: { flex: 1 } }, [
          email,
          pending && div({ style: styles.pending }, ["Pending"]),
          h(AclInput, {
            "aria-label": `permissions for ${email}`,
            autoFocus: email === lastAddedEmail,
            value: aclItem,
            onChange: (v) => setAcl(_.set([index], v)),
            disabled,
            maxAccessLevel: workspace.accessLevel,
            isAzureWorkspace: isAzureWorkspace(workspace),
          }),
        ]),
        !disabled &&
          h(
            Link,
            {
              tooltip: "Remove",
              onClick: () => setAcl(_.remove({ email })),
            },
            [icon("times", { size: 20, style: { marginRight: "0.5rem" } })]
          ),
      ]
    );
  };

  // Lifecycle
  useOnMount(() => {
    const load = async () => {
      try {
        const [{ acl }, shareSuggestions, groups] = await Promise.all([
          Ajax(signal).Workspaces.workspace(namespace, name).getAcl(),
          Ajax(signal).Workspaces.getShareLog(),
          Ajax(signal).Groups.list(),
        ]);

        const fixedAcl = _.flow(
          _.toPairs,
          _.map(([email, data]) => ({ email, ...data })),
          _.sortBy((x) => -Utils.workspaceAccessLevels.indexOf(x.accessLevel))
        )(acl);

        setAcl(fixedAcl);
        setOriginalAcl(fixedAcl);
        setGroups(groups);
        setShareSuggestions(shareSuggestions);
        setLoaded(true);
      } catch (error) {
        onDismiss();
        reportError("Error looking up collaborators", error);
      }
    };

    load();
  });

  useLayoutEffect(() => {
    !!lastAddedEmail && list.current.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [lastAddedEmail]);

  // Render
  const searchValueValid = !validate({ searchValue }, { searchValue: { email: true } });
  const aclEmails = _.map("email", acl);

  const suggestions = _.flow(_.map("groupEmail"), _.concat(shareSuggestions), (list) => _.difference(list, aclEmails), _.uniq)(groups);

  const remainingSuggestions = _.difference(suggestions, _.map("email", acl));

  const addUserReminder = `Did you mean to add ${searchValue} as a collaborator? Add them or clear the "User email" field to save changes.`;

  const addCollaborator = (collaboratorEmail) => {
    if (!validate.single(collaboratorEmail, { email: true, exclusion: aclEmails })) {
      setSearchValue("");
      setAcl(Utils.append({ email: collaboratorEmail, accessLevel: "READER" }));
      setLastAddedEmail(collaboratorEmail);
    }
  };

  // The get workspace ACL API endpoint returns emails capitalized as they are registered in Terra.
  // However, a user may type in the support email using different capitalization (terra-support, TERRA-SUPPORT, etc.)
  // The email they entered will appear in the ACL stored in this component's state until updates are saved.
  // We want the share with support switch to function with any variation of the support email.
  const aclEntryIsTerraSupport = ({ email }) => _.toLower(email) === _.toLower(terraSupportEmail);
  const currentTerraSupportAccessLevel = _.find(aclEntryIsTerraSupport, originalAcl)?.accessLevel;
  const newTerraSupportAccessLevel = _.find(aclEntryIsTerraSupport, acl)?.accessLevel;
  const addTerraSupportToAcl = () => addCollaborator(terraSupportEmail);
  const removeTerraSupportFromAcl = () => setAcl(_.remove(aclEntryIsTerraSupport));

  const save = Utils.withBusyState(setWorking, async () => {
    const aclEmails = _.map("email", acl);
    const needsDelete = _.remove((entry) => aclEmails.includes(entry.email), originalAcl);
    const numAdditions = _.filter(({ email }) => !_.some({ email }, originalAcl), acl).length;
    const eventData = { numAdditions, ...extractWorkspaceDetails(workspace.workspace) };

    const aclUpdates = [
      ..._.flow(_.remove({ accessLevel: "PROJECT_OWNER" }), _.map(_.pick(["email", "accessLevel", "canShare", "canCompute"])))(acl),
      ..._.map(({ email }) => ({ email, accessLevel: "NO ACCESS" }), needsDelete),
    ];

    try {
      await Ajax().Workspaces.workspace(namespace, name).updateAcl(aclUpdates);
      !!numAdditions && Ajax().Metrics.captureEvent(Events.workspaceShare, { ...eventData, success: true });
      if (!currentTerraSupportAccessLevel && newTerraSupportAccessLevel) {
        Ajax().Metrics.captureEvent(Events.workspaceShareWithSupport, extractWorkspaceDetails(workspace.workspace));
      }
      onDismiss();
    } catch (error) {
      !!numAdditions && Ajax().Metrics.captureEvent(Events.workspaceShare, { ...eventData, success: false });
      setUpdateError(await error.text());
    }
  });

  return h(
    Modal,
    {
      title: "Share Workspace",
      width: 550,
      showButtons: false,
      onDismiss,
    },
    [
      div({ style: { display: "flex", alignItems: "flex-end" } }, [
        h(IdContainer, [
          (id) =>
            div({ style: { flexGrow: 1, marginRight: "1rem" } }, [
              h(FormLabel, { id }, ["User email"]),
              h(AutocompleteTextInput, {
                labelId: id,
                openOnFocus: true,
                placeholderText: _.includes(searchValue, aclEmails)
                  ? "This email has already been added to the list"
                  : 'Type an email address and press "Enter" or "Return"',
                onPick: addCollaborator,
                placeholder: "Add people or groups",
                value: searchValue,
                onFocus: () => {
                  setSearchHasFocus(true);
                },
                onBlur: () => {
                  setSearchHasFocus(false);
                },
                onChange: setSearchValue,
                suggestions: Utils.cond(
                  [searchValueValid && !_.includes(searchValue, aclEmails), () => [searchValue]],
                  [remainingSuggestions.length, () => remainingSuggestions],
                  () => []
                ),
                style: { fontSize: 16 },
              }),
            ]),
        ]),
        h(
          ButtonPrimary,
          {
            disabled: !searchValueValid,
            tooltip: !searchValueValid && "Enter an email address to add a collaborator",
            onClick: () => {
              addCollaborator(searchValue);
            },
          },
          ["Add"]
        ),
      ]),
      searchValueValid && !searchHasFocus && p(addUserReminder),
      h2({ style: { ...Style.elements.sectionHeader, margin: "1rem 0 0.5rem 0" } }, ["Current Collaborators"]),
      div({ ref: list, role: "list", style: styles.currentCollaboratorsArea }, [
        h(Fragment, _.flow(_.remove(aclEntryIsTerraSupport), Utils.toIndexPairs, _.map(renderCollaborator))(acl)),
        !loaded && centeredSpinner(),
      ]),
      updateError && div({ style: { marginTop: "1rem" } }, [div(["An error occurred:"]), updateError]),
      div({ style: { ...modalStyles.buttonRow, justifyContent: "space-between" } }, [
        h(IdContainer, [
          (id) =>
            h(
              TooltipTrigger,
              {
                content: Utils.cond(
                  [!currentTerraSupportAccessLevel && !newTerraSupportAccessLevel, () => "Allow Terra Support to view this workspace"],
                  [
                    !currentTerraSupportAccessLevel && newTerraSupportAccessLevel,
                    () => `Saving will grant Terra Support ${_.toLower(newTerraSupportAccessLevel)} access to this workspace`,
                  ],
                  [
                    currentTerraSupportAccessLevel && !newTerraSupportAccessLevel,
                    () => "Saving will remove Terra Support's access to this workspace",
                  ],
                  [
                    currentTerraSupportAccessLevel !== newTerraSupportAccessLevel,
                    () =>
                      `Saving will change Terra Support's level of access to this workspace from ${_.toLower(
                        currentTerraSupportAccessLevel
                      )} to ${_.toLower(newTerraSupportAccessLevel)}`,
                  ],
                  [
                    currentTerraSupportAccessLevel === newTerraSupportAccessLevel,
                    () => `Terra Support has ${_.toLower(newTerraSupportAccessLevel)} access to this workspace`,
                  ]
                ),
              },
              [
                label({ htmlFor: id }, [
                  span({ style: { marginRight: "1ch" } }, "Share with Support"),
                  h(Switch, {
                    id,
                    checked: !!newTerraSupportAccessLevel,
                    onLabel: "Yes",
                    offLabel: "No",
                    width: 70,
                    onChange: (checked) => {
                      if (checked) {
                        addTerraSupportToAcl();
                      } else {
                        removeTerraSupportFromAcl();
                      }
                    },
                  }),
                ]),
              ]
            ),
        ]),
        span([
          h(
            ButtonSecondary,
            {
              style: { marginRight: "1rem" },
              onClick: onDismiss,
            },
            "Cancel"
          ),
          h(
            ButtonPrimary,
            {
              disabled: searchValueValid,
              tooltip: searchValueValid && addUserReminder,
              onClick: save,
            },
            "Save"
          ),
        ]),
      ]),
      working && spinnerOverlay,
    ]
  );
};

export default ShareWorkspaceModal;
