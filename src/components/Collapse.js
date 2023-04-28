import _ from "lodash/fp";
import { useEffect, useRef, useState } from "react";
import { div, h } from "react-hyperscript-helpers";
import { Link } from "src/components/common";
import { icon } from "src/components/icons";
import colors from "src/libs/colors";
import { useUniqueId } from "src/libs/react-utils";
import * as Style from "src/libs/style";

const Collapse = ({
  title,
  hover,
  tooltip,
  tooltipDelay,
  summaryStyle,
  detailsStyle,
  initialOpenState,
  children,
  titleFirst,
  afterTitle,
  onFirstOpen = () => {},
  noTitleWrap,
  ...props
}) => {
  const [isOpened, setIsOpened] = useState(initialOpenState);
  const angleIcon = icon(isOpened ? "angle-down" : "angle-right", {
    style: {
      flexShrink: 0,
      marginLeft: titleFirst ? "auto" : undefined,
      marginRight: titleFirst ? undefined : "0.25rem",
    },
  });

  const firstOpenRef = useRef(_.once(onFirstOpen));
  const id = useUniqueId();

  useEffect(() => {
    if (isOpened) {
      firstOpenRef.current();
    }
  }, [firstOpenRef, isOpened]);

  return div(props, [
    div(
      {
        style: {
          position: "relative",
          display: "flex",
          alignItems: "center",
          ...summaryStyle,
        },
      },
      [
        !titleFirst && angleIcon,
        h(
          Link,
          {
            "aria-expanded": isOpened,
            "aria-controls": isOpened ? id : undefined,
            style: {
              color: colors.dark(),
              ...(noTitleWrap ? Style.noWrapEllipsis : {}),
            },
            onClick: () => setIsOpened(!isOpened),
            hover,
            tooltip,
            tooltipDelay,
          },
          [
            div({
              "aria-hidden": true,
              // zIndex: 1 lifts this element above angleIcon, so that clicking on the icon will toggle the Collapse.
              style: { position: "absolute", top: 0, left: 0, bottom: 0, right: 0, zIndex: 1 },
            }),
            title,
          ]
        ),
        // zIndex: 2 lifts afterTitle controls above the absolutely positioned div in Link so that they can be clicked.
        // display: flex and flex: 1 causes this div to fill available space. This makes it easy to position afterTitle
        // controls just after the summary text or at the right edge of the summary section. height: 0 prevents the unused
        // space in this div from blocking clicks on the summary section.
        afterTitle && div({ style: { display: "flex", flex: 1, alignItems: "center", height: 0, margin: "0 1ch", zIndex: 2 } }, [afterTitle]),
        titleFirst && angleIcon,
      ]
    ),
    isOpened && div({ id, style: detailsStyle }, [children]),
  ]);
};

export default Collapse;
