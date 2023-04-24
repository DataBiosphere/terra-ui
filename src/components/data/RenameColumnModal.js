import { Fragment, useState } from "react";
import { div, h } from "react-hyperscript-helpers";
import { ButtonPrimary, IdContainer, spinnerOverlay } from "src/components/common";
import { ValidatedInput } from "src/components/input";
import Modal from "src/components/Modal";
import { Ajax } from "src/libs/ajax";
import { reportError } from "src/libs/error";
import { FormLabel } from "src/libs/forms";

const RenameColumnModal = ({ onDismiss, onSuccess, namespace, name, entityType, oldAttributeName }) => {
  // State
  const [newAttributeName, setNewAttributeName] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const renameColumn = async () => {
    try {
      setIsBusy(true);
      await Ajax().Workspaces.workspace(namespace, name).renameEntityColumn(entityType, oldAttributeName, newAttributeName);
      onSuccess();
    } catch (e) {
      onDismiss();
      reportError("Unable to rename column.", e);
    }
  };

  return h(
    Modal,
    {
      onDismiss,
      title: "Rename Column",
      okButton: h(
        ButtonPrimary,
        {
          disabled: isBusy,
          onClick: renameColumn,
        },
        ["Rename"]
      ),
    },
    [
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            div("Workflow configurations that reference the current column name will need to be updated manually."),
            h(FormLabel, { htmlFor: id, required: true }, ["New Name"]),
            h(ValidatedInput, {
              inputProps: {
                id,
                value: newAttributeName,
                autoFocus: true,
                placeholder: "Enter a name",
                onChange: (v) => {
                  setNewAttributeName(v);
                },
              },
            }),
            isBusy && spinnerOverlay,
          ]),
      ]),
    ]
  );
};

export default RenameColumnModal;
