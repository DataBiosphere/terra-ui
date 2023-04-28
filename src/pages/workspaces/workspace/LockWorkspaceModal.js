import { useState } from "react";
import { div, h } from "react-hyperscript-helpers";
import { ButtonPrimary, spinnerOverlay } from "src/components/common";
import Modal from "src/components/Modal";
import { Ajax } from "src/libs/ajax";
import { withErrorReportingInModal } from "src/libs/error";

const LockWorkspaceModal = ({
  workspace: {
    workspace: { namespace, name, isLocked },
  },
  onDismiss,
  onSuccess,
}) => {
  const [togglingLock, setTogglingLock] = useState(false);
  const helpText = isLocked ? "Unlock Workspace" : "Lock Workspace";

  const onFailureDismiss = () => {
    setTogglingLock(false);
    onDismiss();
  };

  const toggleWorkspaceLock = withErrorReportingInModal("Error toggling workspace lock", onFailureDismiss, async () => {
    setTogglingLock(true);
    isLocked ? await Ajax().Workspaces.workspace(namespace, name).unlock() : await Ajax().Workspaces.workspace(namespace, name).lock();
    onDismiss();
    onSuccess();
  });
  return h(
    Modal,
    {
      title: helpText,
      onDismiss,
      okButton: h(
        ButtonPrimary,
        {
          onClick: toggleWorkspaceLock,
        },
        helpText
      ),
    },
    [
      isLocked
        ? div(["Are you sure you want to unlock this workspace? ", "Collaborators will be able to modify the workspace after it is unlocked."])
        : div(["Are you sure you want to lock this workspace? ", "Collaborators will not be able to modify the workspace while it is locked."]),
      togglingLock && spinnerOverlay,
    ]
  );
};

export default LockWorkspaceModal;
