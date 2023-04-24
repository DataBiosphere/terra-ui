import _ from "lodash/fp";
import { Children, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGetter, useOnMount } from "src/libs/react-utils";
import * as Utils from "src/libs/utils";

export const useDynamicPosition = (selectors) => {
  const pickValues = _.pick(["top", "bottom", "left", "right", "width", "height"]);
  const [dimensions, setDimensions] = useState(
    _.map(({ viewport }) => {
      return viewport ? { width: 0, height: 0 } : { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
    }, selectors)
  );
  const getDimensions = useGetter(dimensions);
  const animation = useRef();
  const computePosition = () => {
    const newDimensions = _.map(({ ref, id, viewport }) => {
      return Utils.cond(
        [ref, () => pickValues(ref.current?.getBoundingClientRect())],
        [id, () => pickValues(document.getElementById(id)?.getBoundingClientRect())],
        [viewport, () => ({ width: window.innerWidth, height: window.innerHeight })]
      );
    }, selectors);
    if (!_.isEqual(newDimensions, getDimensions())) {
      setDimensions(newDimensions);
    }
    animation.current = requestAnimationFrame(computePosition);
  };
  useOnMount(() => {
    computePosition();
    return () => cancelAnimationFrame(animation.current);
  });
  return dimensions;
};

export const useWindowDimensions = () => {
  const [dimensions, setDimensions] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));

  useEffect(() => {
    const onResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return dimensions;
};

export const computePopupPosition = ({ side, viewport, target, element, gap }) => {
  const getPosition = (s) => {
    const left = _.flow(
      _.clamp(0, viewport.width - element.width),
      _.clamp(target.left - element.width + 16, target.right - 16)
    )((target.left + target.right) / 2 - element.width / 2);
    const top = _.flow(
      _.clamp(0, viewport.height - element.height),
      _.clamp(target.top - element.height + 16, target.bottom - 16)
    )((target.top + target.bottom) / 2 - element.height / 2);
    return Utils.switchCase(
      s,
      ["top", () => ({ top: target.top - element.height - gap, left })],
      ["bottom", () => ({ top: target.bottom + gap, left })],
      ["left", () => ({ left: target.left - element.width - gap, top })],
      ["right", () => ({ left: target.right + gap, top })]
    );
  };
  const position = getPosition(side);
  const maybeFlip = (d) => {
    return Utils.switchCase(
      d,
      ["top", () => (position.top < 0 ? "bottom" : "top")],
      ["bottom", () => (position.top + element.height >= viewport.height ? "top" : "bottom")],
      ["left", () => (position.left < 0 ? "right" : "left")],
      ["right", () => (position.left + element.width >= viewport.width ? "left" : "right")]
    );
  };
  const finalSide = maybeFlip(side);
  const finalPosition = getPosition(finalSide);
  return { side: finalSide, position: finalPosition };
};

// Render popups, modals, etc. into the #modal-root element.
// Create the element if it does not exist.
export const getPopupRoot = () => {
  let popupRoot = document.getElementById("modal-root");
  if (!popupRoot) {
    popupRoot = document.createElement("div");
    popupRoot.id = "modal-root";
    popupRoot.role = "complementary";
    document.body.append(popupRoot);
  }
  return popupRoot;
};

export const PopupPortal = ({ children }) => {
  return createPortal(Children.only(children), getPopupRoot());
};
