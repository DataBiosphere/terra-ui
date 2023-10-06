import _ from 'lodash/fp';
import { Children, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGetter, useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';

export const useDynamicPosition = (selectors) => {
  const pickValues = _.pick(['top', 'bottom', 'left', 'right', 'width', 'height']);
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

// Render popups, modals, etc. into the #modal-root element.
// Create the element if it does not exist.
export const getPopupRoot = () => {
  let popupRoot = document.getElementById('modal-root');
  if (!popupRoot) {
    popupRoot = document.createElement('div');
    popupRoot.id = 'modal-root';
    popupRoot.role = 'complementary';
    document.body.append(popupRoot);
  }
  return popupRoot;
};

export const PopupPortal = ({ children }) => {
  return createPortal(Children.only(children), getPopupRoot());
};
