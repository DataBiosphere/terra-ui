import _ from "lodash/fp";
import * as qs from "qs";
import { div, h } from "react-hyperscript-helpers";
import { ButtonOutline } from "src/components/common";
import * as Nav from "src/libs/nav";
import { notify } from "src/libs/notifications";
import { useOnMount } from "src/libs/react-utils";
import * as Utils from "src/libs/utils";

function FirecloudNotification() {
  const { query } = Nav.useRoute();
  useOnMount(() => {
    if (_.has("fcredir", query)) {
      notify(
        "welcome",
        div({ style: { fontSize: 14 } }, [
          div(["Welcome to the new FireCloud interface, powered by Terra. All of your workspaces are available."]),
          div({ style: { marginTop: "1rem" } }, [
            'To access legacy FireCloud, click the three-bar menu on the upper-left corner and select "Use Classic FireCloud".',
          ]),
          div({ style: { marginTop: "1rem" } }, [
            "Please update your bookmarks to our new URL, firecloud.terra.bio. Welcome to the future of FireCloud!",
          ]),
          h(
            ButtonOutline,
            {
              ...Utils.newTabLinkProps,
              href: "https://support.terra.bio/hc/en-us/articles/360022506932-Uniquely-Terra-What-s-new-and-coming-soon",
              style: { marginTop: "1rem" },
            },
            ["Learn what's new and different"]
          ),
        ])
      );
      Nav.history.replace({ search: qs.stringify(_.omit(["fcredir"], query)) });
    }
  });
  return null;
}

export default FirecloudNotification;
