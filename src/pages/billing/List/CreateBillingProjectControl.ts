import { Fragment } from "react";
import { h, span } from "react-hyperscript-helpers";
import { ButtonOutline } from "src/components/common";
import { icon } from "src/components/icons";
import { MenuButton } from "src/components/MenuButton";
import { MenuTrigger } from "src/components/PopupTrigger";
import { CloudProvider } from "src/libs/workspace-utils";

interface CreateBillingProjectControlProps {
  isAzurePreviewUser: boolean;
  showCreateProjectModal: (type: CloudProvider) => void;
}

export const CreateBillingProjectControl = (props: CreateBillingProjectControlProps) => {
  const createButton = (type: CloudProvider | undefined) => {
    return h(
      ButtonOutline,
      {
        "aria-label": "Create new billing project",
        onClick: () => (type !== undefined ? props.showCreateProjectModal(type) : undefined),
      },
      [span([icon("plus-circle", { style: { marginRight: "1ch" } }), "Create"])]
    );
  };

  if (!props.isAzurePreviewUser) {
    return createButton("GCP");
  }
  return h(
    MenuTrigger,
    {
      side: "bottom",
      closeOnClick: true,
      content: h(Fragment, [
        h(
          MenuButton,
          {
            "aria-haspopup": "dialog",
            onClick: () => props.showCreateProjectModal("AZURE"),
          },
          ["Azure Billing Project"]
        ),
        h(
          MenuButton,
          {
            "aria-haspopup": "dialog",
            onClick: () => props.showCreateProjectModal("GCP"),
          },
          ["GCP Billing Project"]
        ),
      ]),
    },
    [createButton(undefined)]
  );
};
