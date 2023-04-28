import _ from "lodash/fp";
import * as qs from "qs";
import { Fragment, useState } from "react";
import { div, h } from "react-hyperscript-helpers";
import { ButtonPrimary, Link, spinnerOverlay } from "src/components/common";
import { icon } from "src/components/icons";
import Modal from "src/components/Modal";
import { Ajax } from "src/libs/ajax";
import { getConfig } from "src/libs/config";
import { withErrorReporting } from "src/libs/error";
import * as Nav from "src/libs/nav";
import { notify } from "src/libs/notifications";
import { useOnMount } from "src/libs/react-utils";
import { authStore } from "src/libs/state";
import * as Utils from "src/libs/utils";

export const ShibbolethLink = ({ button = false, children, ...props }) => {
  const nihRedirectUrl = `${window.location.origin}/${Nav.getLink("profile")}?nih-username-token=<token>`;
  return h(
    button ? ButtonPrimary : Link,
    _.merge(
      {
        href: `${getConfig().shibbolethUrlRoot}/login?${qs.stringify({ "return-url": nihRedirectUrl })}`,
        ...(button ? {} : { style: { display: "inline-flex", alignItems: "center" } }),
        ...Utils.newTabLinkProps,
      },
      props
    ),
    [children, icon("pop-out", { size: 12, style: { marginLeft: "0.2rem" } })]
  );
};

export const FrameworkServiceLink = ({ linkText, provider, redirectUrl, button = false, ...props }) => {
  const [href, setHref] = useState();

  useOnMount(() => {
    const loadAuthUrl = withErrorReporting("Error getting Fence Link", async () => {
      const result = await Ajax().User.getFenceAuthUrl(provider, redirectUrl);
      setHref(result.url);
    });
    loadAuthUrl();
  });

  return href
    ? h(
        button ? ButtonPrimary : Link,
        {
          href,
          ...(button ? {} : { style: { display: "inline-flex", alignItems: "center" } }),
          ...Utils.newTabLinkProps,
          ...props,
        },
        [linkText, icon("pop-out", { size: 12, style: { marginLeft: "0.2rem" } })]
      )
    : h(Fragment, [linkText]);
};

export const UnlinkFenceAccount = ({ linkText, provider }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  return div({ style: { display: "inline-flex" } }, [
    h(
      Link,
      {
        onClick: () => {
          setIsModalOpen(true);
        },
      },
      [linkText]
    ),
    isModalOpen &&
      h(
        Modal,
        {
          title: "Confirm unlink account",
          onDismiss: () => setIsModalOpen(false),
          okButton: h(
            ButtonPrimary,
            {
              onClick: _.flow(
                withErrorReporting("Error unlinking account"),
                Utils.withBusyState(setIsUnlinking)
              )(async () => {
                await Ajax().User.unlinkFenceAccount(provider.key);
                authStore.update(_.set(["fenceStatus", provider.key], {}));
                setIsModalOpen(false);
                notify("success", "Successfully unlinked account", {
                  message: `Successfully unlinked your account from ${provider.name}`,
                  timeout: 30000,
                });
              }),
            },
            "OK"
          ),
        },
        [
          div([`Are you sure you want to unlink from ${provider.name}?`]),
          div({ style: { marginTop: "1rem" } }, ["You will lose access to any underlying datasets. You can always re-link your account later."]),
          isUnlinking && spinnerOverlay,
        ]
      ),
  ]);
};
