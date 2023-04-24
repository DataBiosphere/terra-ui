import { Fragment } from "react";
import { h, input, label } from "react-hyperscript-helpers";

import { IdContainer } from "./IdContainer";

export const RadioButton = ({ text, name, labelStyle, ...props }) => {
  return h(IdContainer, [
    (id) =>
      h(Fragment, [
        input({
          type: "radio",
          id,
          name,
          ...props,
        }),
        text && label({ htmlFor: id, style: labelStyle }, [text]),
      ]),
  ]);
};
