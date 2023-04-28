import _ from "lodash/fp";
import { Fragment, useEffect, useState } from "react";
import { h } from "react-hyperscript-helpers";
import { ButtonPrimary, IdContainer } from "src/components/common";
import { ValidatedInput } from "src/components/input";
import Modal from "src/components/Modal";
import { FormLabel } from "src/libs/forms";

export const NameModal = ({ onSuccess, onDismiss, thing, value, validator = null, validationMessage = "Invalid input" }) => {
  const [name, setName] = useState(value || "");
  const [inputTouched, setInputTouched] = useState(false);
  const [error, setError] = useState(null);
  const isUpdate = value !== undefined;

  useEffect(() => {
    if (!name && inputTouched) {
      setError("Name is required");
    } else if (_.isRegExp(validator) && !validator.test(name)) {
      setError(validationMessage);
    } else if (_.isFunction(validator)) {
      const msg = validator(name);
      setError(msg === false ? null : _.isString(msg) ? msg : validationMessage);
    } else {
      setError(null);
    }
  }, [name, inputTouched]); // eslint-disable-line react-hooks/exhaustive-deps

  return h(
    Modal,
    {
      title: (isUpdate ? "Update " : "Create a New ") + thing,
      onDismiss,
      okButton: h(
        ButtonPrimary,
        {
          onClick: () => onSuccess({ name }),
          disabled: !name || error !== null,
        },
        [isUpdate ? "Update " : "Create ", thing]
      ),
    },
    [
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            h(FormLabel, { htmlFor: id, required: true }, [thing, " name"]),
            h(ValidatedInput, {
              inputProps: {
                id,
                autoFocus: true,
                placeholder: "Enter a name",
                value: name,
                onChange: (v) => {
                  setInputTouched(true);
                  setName(v);
                },
              },
              error,
            }),
          ]),
      ]),
    ]
  );
};
