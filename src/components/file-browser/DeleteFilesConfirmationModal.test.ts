import { render, screen } from "@testing-library/react";
import { h } from "react-hyperscript-helpers";

import { DeleteFilesConfirmationModal } from "./DeleteFilesConfirmationModal";

describe("DeleteFilesConfirmationModal", () => {
  it("renders list of files to be deleted", () => {
    render(
      h(DeleteFilesConfirmationModal, {
        files: [
          {
            path: "path/to/file1.txt",
            url: "gs://test-bucket/path/to/file1.txt",
            size: 1024,
            createdAt: 1667408400000,
            updatedAt: 1667408400000,
          },
          {
            path: "path/to/file2.bam",
            url: "gs://test-bucket/path/to/file2.bam",
            size: 1024 ** 2,
            createdAt: 1667410200000,
            updatedAt: 1667410200000,
          },
          {
            path: "path/to/file3.vcf",
            url: "gs://test-bucket/path/to/file3.vcf",
            size: 1024 ** 3,
            createdAt: 1667412000000,
            updatedAt: 1667412000000,
          },
        ],
        onDismiss: () => {},
      })
    );

    screen.getByText("file1.txt");
    screen.getByText("file2.bam");
    screen.getByText("file3.vcf");
  });
});
