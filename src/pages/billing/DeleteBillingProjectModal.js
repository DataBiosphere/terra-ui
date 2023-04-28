import { b, div, h } from "react-hyperscript-helpers";
import { DeleteConfirmationModal, spinnerOverlay } from "src/components/common";

const DeleteBillingProjectModal = ({ projectName, deleting, ...props }) => {
  return h(
    DeleteConfirmationModal,
    {
      ...props,
      objectType: "billing project",
      objectName: projectName,
    },
    [
      div(["Are you sure you want to delete the billing project ", b({ style: { wordBreak: "break-word" } }, [projectName]), "?"]),
      div({ style: { marginTop: "1rem" } }, ["The billing project cannot be restored."]),
      deleting && spinnerOverlay,
    ]
  );
};

export default DeleteBillingProjectModal;
