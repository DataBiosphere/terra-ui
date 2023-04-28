import { MouseEventHandler, ReactNode } from "react";
import { div, h } from "react-hyperscript-helpers";
import { Link } from "src/components/common";
import { icon } from "src/components/icons";

interface ITitleBar {
  id: string;
  onPrevious: MouseEventHandler;
  title: ReactNode;
  onDismiss: MouseEventHandler;
  titleChildren: ReactNode;
  style?: React.CSSProperties;
  titleStyles?: React.CSSProperties;
  hideCloseButton?: boolean;
}

const TitleBar = ({
  id,
  onPrevious,
  title,
  onDismiss,
  titleChildren,
  style = {},
  titleStyles = {},
  hideCloseButton = false,
}: ITitleBar) => {
  return div(
    {
      id,
      style: {
        display: "flex",
        alignItems: "flex-start",
        flex: "none",
        ...style,
      },
    },
    [
      div({ style: { fontSize: 18, fontWeight: 600, ...titleStyles } }, [title]),
      titleChildren,
      div({ style: { marginLeft: "auto", display: "flex", alignItems: "center" } }, [
        onPrevious &&
          h(
            Link,
            {
              "aria-label": "Back",
              style: { marginLeft: "2rem" },
              onClick: onPrevious,
            },
            [icon("arrowLeftRegular", { size: 22 })]
          ),
        onDismiss &&
          h(
            Link,
            {
              "aria-label": "Close",
              style: { marginLeft: "2rem" },
              tabIndex: hideCloseButton ? -1 : 0,
              "aria-disabled": hideCloseButton,
              onClick: onDismiss,
            },
            [icon("times", { size: 25, style: hideCloseButton ? { display: "none" } : {} })]
          ),
      ]),
    ]
  );
};

export default TitleBar;
