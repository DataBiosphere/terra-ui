import { Fragment, useEffect, useState } from "react";
import { a, div, h } from "react-hyperscript-helpers";
import { Clickable, Link } from "src/components/common";
import { icon } from "src/components/icons";
import { isBioDataCatalyst } from "src/libs/brand-utils";
import colors from "src/libs/colors";
import { footerLogo } from "src/libs/logos";
import * as Nav from "src/libs/nav";
import * as Utils from "src/libs/utils";

const styles = {
  item: { marginLeft: "2rem" },
  footer: {
    flex: "none",
    padding: "0 1rem",
    backgroundColor: colors.secondary(),
    color: "white",
  },
};

const buildTimestamp = new Date(parseInt(process.env.REACT_APP_BUILD_TIMESTAMP, 10));

// If you change the layout here, make sure it's reflected in the pre-rendered version in public/index.html
const FooterWrapper = ({ children, alwaysShow = false, fixedHeight = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrollBarHeight, setScrollBarHeight] = useState(window.innerHeight - document.body.offsetHeight);

  useEffect(() => {
    function handleResize() {
      const newScrollBarHeight = window.innerHeight - document.body.offsetHeight;
      if (scrollBarHeight !== newScrollBarHeight) {
        setScrollBarHeight(newScrollBarHeight);
      }
    }

    if (fixedHeight) {
      window.addEventListener("resize", handleResize);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  const popoutItem = ({ link, displayName }) => {
    return h(Fragment, [
      div({ style: styles.item }, "|"),
      a(
        {
          href: link,
          ...Utils.newTabLinkProps,
          style: styles.item,
        },
        [displayName, icon("pop-out", { size: 12, style: { marginLeft: "0.5rem" } })]
      ),
    ]);
  };

  const expandedFooterHeight = 60;
  const shrunkFooterHeight = 20;

  const bdcFooterContent = div({ style: { display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: "0.5rem 2rem", fontSize: 10 } }, [
    a({ href: "https://biodatacatalyst.nhlbi.nih.gov/privacy", ...Utils.newTabLinkProps }, "Privacy Policy"),
    a({ href: "https://www.nhlbi.nih.gov/about/foia-fee-for-service-office", ...Utils.newTabLinkProps }, "Freedom of Information Act (FOIA)"),
    a({ href: "https://biodatacatalyst.nhlbi.nih.gov/accessibility", ...Utils.newTabLinkProps }, "Accessibility"),
    a({ href: "https://www.hhs.gov/", ...Utils.newTabLinkProps }, "U.S. Department of Health &  Human Services"),
    a({ href: "https://osp.od.nih.gov/scientific-sharing/policies/", ...Utils.newTabLinkProps }, "Data Sharing Policy"),
    a({ href: "https://www.nih.gov/", ...Utils.newTabLinkProps }, "National Institutes of Health"),
    a({ href: "https://www.usa.gov/", ...Utils.newTabLinkProps }, "USA.gov"),
    a({ href: "https://www.nhlbi.nih.gov/", ...Utils.newTabLinkProps }, "National Heart, Lung, and Blood Institute"),
    a({ href: "https://www.hhs.gov/vulnerability-disclosure-policy/index.html", ...Utils.newTabLinkProps }, "HHS Vulnerability Disclosure"),
  ]);

  const standardFooterContent = h(Fragment, [
    h(Link, { href: Nav.getLink("root") }, [footerLogo()]),
    a({ href: Nav.getLink("privacy"), style: styles.item }, "Privacy Policy"),
    div({ style: styles.item }, "|"),
    a({ href: Nav.getLink("terms-of-service"), style: styles.item }, "Terms of Service"),
    popoutItem({
      link: "https://support.terra.bio/hc/en-us/articles/360030793091-Terra-FireCloud-Security-Posture",
      displayName: "Security",
    }),
    popoutItem({
      link: "https://support.terra.bio/hc/en-us",
      displayName: "Documentation",
    }),
    popoutItem({
      link: "https://terra.bio",
      displayName: "Terra.bio",
    }),
    div({ style: { flexGrow: 1 } }),
    div({ style: { fontWeight: 600, fontSize: "10px" } }, [`Copyright ©${buildTimestamp.getFullYear()}`]),
  ]);

  const footerExists = isBioDataCatalyst() || alwaysShow;
  const expandedFooterVisible = isExpanded || alwaysShow;

  return div(
    { style: { display: "flex", flexDirection: "column", height: fixedHeight ? `calc(100vh - ${scrollBarHeight}px)` : "100%", flexGrow: 1 } },
    [
      div({ style: { display: "flex", flexDirection: "column", flexGrow: 1 } }, [children]),
      footerExists &&
        h(
          div,
          {
            role: "contentinfo",
            style: styles.footer,
          },
          [
            !alwaysShow &&
              h(
                Clickable,
                {
                  onClick: () => {
                    setIsExpanded(!isExpanded);
                  },
                  style: { fontSize: 10, padding: "0.25rem 0", height: shrunkFooterHeight },
                },
                [`${isExpanded ? "Hide" : "Show"} Legal and Regulatory Information`]
              ),
            expandedFooterVisible &&
              div(
                {
                  style: { display: "flex", alignItems: "center", height: expandedFooterHeight },
                },
                [!isBioDataCatalyst() ? standardFooterContent : bdcFooterContent]
              ),
          ]
        ),
    ]
  );
};

export default FooterWrapper;
