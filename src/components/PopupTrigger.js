import _ from "lodash/fp";
import { Children, cloneElement, Fragment, useEffect, useImperativeHandle, useRef, useState } from "react";
import { div, h, hr } from "react-hyperscript-helpers";
import onClickOutside from "react-onclickoutside";
import { Clickable, FocusTrapper } from "src/components/common";
import { icon } from "src/components/icons";
import { VerticalNavigation } from "src/components/keyboard-nav";
import { computePopupPosition, PopupPortal, useDynamicPosition } from "src/components/popup-utils";
import colors from "src/libs/colors";
import { forwardRefWithName, useLabelAssert, useUniqueId } from "src/libs/react-utils";
import * as Style from "src/libs/style";

const styles = {
  popup: {
    position: "fixed",
    top: 0,
    left: 0,
    backgroundColor: "white",
    border: `1px solid ${colors.dark(0.55)}`,
    borderRadius: 4,
    boxShadow: Style.standardShadow,
  },
};

// This is written as a "function" function rather than an arrow function because react-onclickoutside wants it to have a prototype
// eslint-disable-next-line prefer-arrow-callback
export const Popup = onClickOutside(function ({ id, side = "right", target: targetId, onClick, children, popupProps = {} }) {
  // We're passing popupProps here rather than just props, because ...props also includes lots of internal onClickOutside properties which
  // aren't valid to be dropped on a DOM element.
  useLabelAssert("Popup", popupProps);

  const elementRef = useRef();
  const [target, element, viewport] = useDynamicPosition([{ id: targetId }, { ref: elementRef }, { viewport: true }]);
  const { position } = computePopupPosition({ side, target, element, viewport, gap: 10 });
  return h(PopupPortal, [
    div(
      {
        id,
        role: "dialog",
        "aria-modal": true,
        onClick,
        ref: elementRef,
        ...popupProps,
        style: {
          transform: `translate(${position.left}px, ${position.top}px)`,
          visibility: !viewport.width ? "hidden" : undefined,
          ...styles.popup,
          ...popupProps.style,
        },
      },
      [children]
    ),
  ]);
});

const PopupTrigger = forwardRefWithName(
  "PopupTrigger",
  ({ content, side, closeOnClick, onChange, popupProps: { role = "dialog", ...popupProps } = {}, children, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const id = useUniqueId();
    const menuId = useUniqueId();
    useImperativeHandle(ref, () => ({
      close: () => setOpen(false),
    }));

    useEffect(() => {
      onChange && onChange(open);
    }, [open, onChange]);

    const child = Children.only(children);
    const childId = child.props.id || id;
    const labelledby = child.props["aria-labelledby"] || childId;

    return h(Fragment, [
      cloneElement(child, {
        id: childId,
        "aria-haspopup": role,
        "aria-expanded": open,
        "aria-controls": open ? menuId : undefined, // 'dialog', 'listbox', 'menu' are valid values
        "aria-owns": open ? menuId : undefined,
        className: `${child.props.className || ""} ${childId}`,
        onClick: (...args) => {
          child.props.onClick && child.props.onClick(...args);
          setOpen(!open);
        },
      }),
      open &&
        h(
          Popup,
          {
            id: menuId,
            target: childId,
            handleClickOutside: () => setOpen(false),
            outsideClickIgnoreClass: childId,
            onClick: closeOnClick ? () => setOpen(false) : undefined,
            side,
            popupProps: {
              role,
              "aria-labelledby": labelledby,
              ...popupProps,
            },
            ...props,
          },
          [h(FocusTrapper, { onBreakout: () => setOpen(false) }, [content])]
        ),
    ]);
  }
);

export default PopupTrigger;

export const InfoBox = ({ size, children, style, side, tooltip, iconOverride }) => {
  const [open, setOpen] = useState(false);
  return h(
    PopupTrigger,
    {
      side,
      onChange: setOpen,
      content: div({ style: { padding: "0.5rem", width: 300 } }, [children]),
    },
    [
      h(
        Clickable,
        {
          tooltip,
          as: "span",
          "aria-label": "More info",
          "aria-expanded": open,
          "aria-haspopup": true,
        },
        [icon(iconOverride || "info-circle", { size, style: { cursor: "pointer", color: colors.accent(), ...style } })]
      ),
    ]
  );
};

export const makeMenuIcon = (iconName, props) => {
  return icon(iconName, _.merge({ size: 15, style: { marginRight: ".3rem" } }, props));
};

export const MenuDivider = () =>
  hr({
    style: {
      borderWidth: "0 0 1px",
      borderStyle: "solid",
      borderColor: colors.dark(0.55),
      margin: "0.25rem 0",
    },
  });

export const MenuTrigger = ({ children, content, popupProps = {}, ...props }) => {
  return h(
    PopupTrigger,
    {
      content: h(VerticalNavigation, [content]),
      popupProps: {
        role: "menu",
        "aria-modal": undefined,
        "aria-orientation": "vertical",
        ...popupProps,
      },
      ...props,
    },
    [children]
  );
};
