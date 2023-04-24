import { div, h } from "react-hyperscript-helpers";
import { Publication } from "src/libs/ajax/Catalog";
import { FormLabel } from "src/libs/forms";
import {
  generateIndividualInputPropsForObjectField,
  StringInput,
} from "src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs";
import { validate } from "validate.js";

export interface PublicationInputProps {
  onChange: (publication: Publication) => void;
  publication: Publication;
  title?: string;
  wrapperProps?: any;
  required?: boolean;
}

export const PublicationInput = ({
  onChange,
  publication,
  title,
  wrapperProps,
  required = false,
}: PublicationInputProps) => {
  const publicationConstraints = {
    "dcat:accessURL": {
      url: true,
    },
  };
  const errors = validate(publication, publicationConstraints);

  return div(wrapperProps, [
    title && h(FormLabel, { required }, [title]),
    div({ style: { display: "flex", width: "100%" } }, [
      h(
        StringInput,
        generateIndividualInputPropsForObjectField(
          "Title",
          "dct:title",
          "Enter a publication title",
          publication,
          onChange,
          errors,
          2
        )
      ),
      h(
        StringInput,
        generateIndividualInputPropsForObjectField(
          "Access URL",
          "dcat:accessURL",
          "Enter an access URL",
          publication,
          onChange,
          errors,
          2
        )
      ),
    ]),
  ]);
};
