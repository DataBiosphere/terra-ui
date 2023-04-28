import _ from "lodash/fp";
import { Children, cloneElement, Fragment, useRef, useState } from "react";
import { div, h, path, svg } from "react-hyperscript-helpers";
import { containsUnlabelledIcon } from "src/components/icons";
import { computePopupPosition, PopupPortal, useDynamicPosition } from "src/components/popup-utils";
import colors from "src/libs/colors";
import { useOnMount, useUniqueId } from "src/libs/react-utils";
import * as Style from "src/libs/style";
import * as Utils from "src/libs/utils";

const baseToolTip = {
  position: "fixed",
  top: 0,
  left: 0,
  pointerEvents: "none",
  maxWidth: 400,
  borderRadius: 4,
};

const styles = {
  tooltip: {
    background: "#FFFFFF",
    color: colors.dark(),
    borderColor: colors.secondary(),
    padding: "1rem",
    boxShadow: "0 1px 3px 2px rgba(0,0,0,0.3)",
    lineHeight: 1.5,
    ...baseToolTip,
  },
  notch: {
    fill: "#FFFFFF",
    position: "absolute",
    width: 17,
    height: 8,
    marginLeft: -8,
    marginRight: -8,
    marginTop: -8,
    transformOrigin: "bottom",
    filter: "drop-shadow(0px -2px 1px rgba(0,0,0,0.3))",
  },
  lightBox: {
    background: "white",
    border: `1px solid ${colors.dark(0.55)}`,
    boxShadow: Style.standardShadow,
    ...baseToolTip,
  },
};

const Tooltip = ({ side = "bottom", type, target: targetId, children, id, delay }) => {
  const [shouldRender, setShouldRender] = useState(!delay);
  const renderTimeout = useRef();
  const elementRef = useRef();
  const [target, element, viewport] = useDynamicPosition([{ id: targetId }, { ref: elementRef }, { viewport: true }]);

  useOnMount(() => {
    if (delay) {
      renderTimeout.current = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(renderTimeout.current);
    }
  });

  const gap = type === "light" ? 5 : 10;
  const { side: finalSide, position } = computePopupPosition({ side, target, element, viewport, gap });

  const getNotchPosition = () => {
    const left = _.clamp(12, element.width - 12, (target.left + target.right) / 2 - position.left);
    const top = _.clamp(12, element.height - 12, (target.top + target.bottom) / 2 - position.top);
    // Use 1 in placement below to to avoid a faint line along the base of the triangle, where it meets up with the tooltip rectangle.
    return Utils.switchCase(
      finalSide,
      ["top", () => ({ bottom: 1, left, transform: "rotate(180deg)" })],
      ["bottom", () => ({ top: 1, left })],
      ["left", () => ({ right: 1, top, transform: "rotate(90deg)" })],
      ["right", () => ({ left: 1, top, transform: "rotate(270deg)" })]
    );
  };

  return h(PopupPortal, [
    div(
      {
        id,
        role: "tooltip",
        ref: elementRef,
        style: {
          display: shouldRender ? undefined : "none",
          transform: `translate(${position.left}px, ${position.top}px)`,
          visibility: !viewport.width ? "hidden" : undefined,
          ...(type === "light" ? styles.lightBox : styles.tooltip),
        },
      },
      [children, type !== "light" && svg({ viewBox: "0 0 2 1", style: { ...getNotchPosition(), ...styles.notch } }, [path({ d: "M0,1l1,-1l1,1Z" })])]
    ),
  ]);
};

const TooltipTrigger = ({ children, content, useTooltipAsLabel, ...props }) => {
  const [open, setOpen] = useState(false);
  const id = useUniqueId();
  const tooltipId = useUniqueId();
  const descriptionId = useUniqueId();

  const child = Children.only(children);
  const childId = child.props.id || id;

  // To support accessibility, every link must have a label or contain text or a labeled child.
  // If an unlabeled link contains just a single unlabeled icon, then we should use the tooltip as the label,
  // rather than as the description as we otherwise would.
  //
  // If the auto-detection can't make the proper determination, for example, because the icon is wrapped in other elements,
  // you can explicitly pass in a boolean as `useTooltipAsLabel` to force the correct behavior.
  const useAsLabel = _.isNil(useTooltipAsLabel) ? containsUnlabelledIcon({ children, ...props }) : useTooltipAsLabel;

  return h(Fragment, [
    cloneElement(child, {
      id: childId,
      "aria-labelledby": !!content && useAsLabel ? descriptionId : undefined,
      "aria-describedby": !!content && !useAsLabel ? descriptionId : undefined,
      onMouseEnter: (...args) => {
        child.props.onMouseEnter && child.props.onMouseEnter(...args);
        setOpen(true);
      },
      onMouseLeave: (...args) => {
        child.props.onMouseLeave && child.props.onMouseLeave(...args);
        setOpen(false);
      },
      onFocus: (...args) => {
        child.props.onFocus && child.props.onFocus(...args);
        setOpen(true);
      },
      onBlur: (...args) => {
        child.props.onBlur && child.props.onBlur(...args);
        setOpen(false);
      },
    }),
    open && !!content && h(Tooltip, { target: childId, id: tooltipId, ...props }, [content]),
    !!content && div({ id: descriptionId, style: { display: "none" } }, [content]),
  ]);
};

export default TooltipTrigger;
