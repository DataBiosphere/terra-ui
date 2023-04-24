import { b, div, h } from "react-hyperscript-helpers";
import { DeleteConfirmationModal } from "src/components/common";

const DeleteWorkflowConfirmationModal = ({ methodConfig: { name }, ...props }) => {
  return h(
    DeleteConfirmationModal,
    {
      ...props,
      objectType: "workflow",
      objectName: name,
    },
    [
      div(["Are you sure you want to delete the workflow ", b({ style: { wordBreak: "break-word" } }, [name]), "?"]),
      div({ style: { marginTop: "1rem" } }, ["The workflow can be re-added to the workspace, but changes to workflow configuration will be lost."]),
    ]
  );
};

export default DeleteWorkflowConfirmationModal;
