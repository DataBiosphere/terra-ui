import filesize from "filesize";
import React, { Dispatch, SetStateAction } from "react";
import { div, h } from "react-hyperscript-helpers";
import { AutoSizer } from "react-virtualized";
import { Checkbox, Link } from "src/components/common";
import { basename } from "src/components/file-browser/file-browser-utils";
import { FlexTable, HeaderCell, TextCell } from "src/components/table";
import { FileBrowserFile } from "src/libs/ajax/file-browser-providers/FileBrowserProvider";
import * as Style from "src/libs/style";
import * as Utils from "src/libs/utils";

export interface FilesTableProps {
  "aria-label"?: string;
  files: FileBrowserFile[];
  selectedFiles: { [path: string]: FileBrowserFile };
  setSelectedFiles: Dispatch<SetStateAction<{ [path: string]: FileBrowserFile }>>;
  onClickFile: (file: FileBrowserFile) => void;
}

const FilesTable = (props: FilesTableProps) => {
  const { "aria-label": ariaLabel = "Files", files, selectedFiles, setSelectedFiles, onClickFile } = props;

  const allFilesSelected = files.length > 0 && files.every((file) => file.path in selectedFiles);

  return div({ style: { display: "flex", flex: "1 1 auto" } }, [
    h(AutoSizer, {}, [
      // @ts-expect-error
      ({ width, height }) =>
        // @ts-expect-error
        h(FlexTable, {
          "aria-label": ariaLabel,
          width,
          height,
          rowCount: files.length,
          noContentMessage: " ",
          styleCell: () => ({ padding: "0.5em", borderRight: "none", borderLeft: "none" }),
          styleHeader: () => ({ padding: "0.5em", borderRight: "none", borderLeft: "none" }),
          hoverHighlight: true,
          border: false,
          tabIndex: -1,
          columns: [
            {
              size: { min: 40, grow: 0 },
              headerRenderer: () => {
                return div({ style: { flex: 1, textAlign: "center" } }, [
                  h(Checkbox, {
                    checked: allFilesSelected,
                    disabled: files.length === 0,
                    onChange: allFilesSelected
                      ? () => setSelectedFiles({})
                      : () => setSelectedFiles(Object.fromEntries(files.map((file) => [file.path, file]))),
                    "aria-label": "Select all files",
                  }),
                ]);
              },
              cellRenderer: ({ rowIndex }) => {
                const file = files[rowIndex];
                const isSelected = file.path in selectedFiles;
                return div({ style: { flex: 1, textAlign: "center" } }, [
                  h(Checkbox, {
                    "aria-label": `Select ${basename(file.path)}`,
                    checked: isSelected,
                    onChange: () =>
                      isSelected
                        ? setSelectedFiles((previousSelectedFiles) => {
                            const { [file.path]: _file, ...otherFiles } = previousSelectedFiles;
                            return otherFiles;
                          })
                        : setSelectedFiles((previousSelectedFiles) => ({
                            ...previousSelectedFiles,
                            [file.path]: file,
                          })),
                  }),
                ]);
              },
            },
            {
              size: { min: 100, grow: 1 },
              headerRenderer: () => h(HeaderCell, ["Name"]),
              cellRenderer: ({ rowIndex }) => {
                const file = files[rowIndex];
                return h(
                  Link,
                  {
                    href: file.url,
                    style: {
                      ...(Style.noWrapEllipsis as React.CSSProperties),
                      textDecoration: "underline",
                    },
                    onClick: (e) => {
                      e.preventDefault();
                      onClickFile(file);
                    },
                  },
                  [basename(file.path)]
                );
              },
            },
            {
              size: { min: 150, grow: 0 },
              headerRenderer: () => h(HeaderCell, ["Size"]),
              cellRenderer: ({ rowIndex }) => {
                const file = files[rowIndex];
                return h(TextCell, [filesize(file.size, { round: 0 })]);
              },
            },
            {
              size: { min: 200, grow: 0 },
              headerRenderer: () => h(HeaderCell, ["Last modified"]),
              cellRenderer: ({ rowIndex }) => {
                const file = files[rowIndex];
                return h(TextCell, [Utils.makePrettyDate(file.updatedAt)]);
              },
            },
          ],
        }),
    ]),
  ]);
};

export default FilesTable;
