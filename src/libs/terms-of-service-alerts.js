import _ from "lodash/fp";
import { Fragment, useEffect } from "react";
import { br, h } from "react-hyperscript-helpers";
import { Link } from "src/components/common";
import { Ajax } from "src/libs/ajax";
import * as Nav from "src/libs/nav";
import { useStore } from "src/libs/react-utils";
import { authStore } from "src/libs/state";
import * as Utils from "src/libs/utils";

const getNewTermsOfServiceNeedsAcceptingAlert = async (termsOfServiceState) => {
  const shouldNotify = !termsOfServiceState.userHasAcceptedLatestTos && termsOfServiceState.permitsSystemUsage;
  if (!shouldNotify) {
    return null;
  }

  let responseText;
  try {
    const { text } = await Ajax().FirecloudBucket.getTosGracePeriodText();
    responseText = text;
  } catch (e) {
    responseText = undefined;
  }
  const gracePeriodText = _.isUndefined(responseText)
    ? "There is currently a grace period allowing you to use Terra under the terms of service you've previously agreed to."
    : responseText;

  return {
    id: "terms-of-service-needs-accepting-grace-period",
    title: "There is a new Terra Terms of Service.",
    message: h(Fragment, [
      h(Fragment, { key: "customText" }, [gracePeriodText]),
      h(Fragment, { key: "lineBreak" }, [br()]),
      h(Link, { href: Nav.getLink("terms-of-service"), key: "tosLink" }, "Accept the new Terms of Service here."),
    ]),
    severity: "error",
  };
};

export const getTermsOfServiceAlerts = async (authState) => {
  const alerts = await getNewTermsOfServiceNeedsAcceptingAlert(authState.termsOfService);
  return _.compact([alerts]);
};

export const tosGracePeriodAlertsStore = Utils.atom([]);

export const useTermsOfServiceAlerts = () => {
  useEffect(() => {
    return authStore.subscribe((authState) =>
      getTermsOfServiceAlerts(authState).then((tosGracePeriodAlerts) => tosGracePeriodAlertsStore.set(tosGracePeriodAlerts), _.noop)
    ).unsubscribe;
  }, []);
  return useStore(tosGracePeriodAlertsStore);
};
