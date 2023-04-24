import { renderHook } from "@testing-library/react-hooks";
import FileBrowserProvider, { FileBrowserFile } from "src/libs/ajax/file-browser-providers/FileBrowserProvider";
import { controlledPromise } from "src/testing/test-utils";

import { reportError } from "../../libs/error";
import { useFileDownloadUrl } from "./useFileDownloadUrl";

jest.mock("src/libs/error", () => ({
  ...jest.requireActual("src/libs/error"),
  reportError: jest.fn(),
}));

describe("useFileDownloadUrl", () => {
  let getDownloadUrlForFileController;

  const mockProvider = {
    getDownloadUrlForFile: jest.fn(() => {
      const [promise, controller] = controlledPromise<string>();
      getDownloadUrlForFileController = controller;
      return promise;
    }),
  } as Partial<FileBrowserProvider> as FileBrowserProvider;

  const file: FileBrowserFile = {
    path: "path/to/example.txt",
    url: "gs://test-bucket/path/to/example.txt",
    size: 1024 ** 2,
    createdAt: 1667408400000,
    updatedAt: 1667494800000,
  };

  it("requests URL for file", () => {
    // Act
    const { result: hookReturnRef } = renderHook(() => useFileDownloadUrl({ file, provider: mockProvider }));
    const result = hookReturnRef.current;

    // Assert
    expect(mockProvider.getDownloadUrlForFile).toHaveBeenCalledWith("path/to/example.txt", {
      signal: expect.any(AbortSignal),
    });
    expect(result).toEqual({ status: "Loading", state: null });
  });

  it("returns URL", async () => {
    // Act
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() =>
      useFileDownloadUrl({ file, provider: mockProvider })
    );
    getDownloadUrlForFileController.resolve(
      "https://storage.googleapis.com/test-bucket/path/to/example.txt?downloadToken=somevalue"
    );
    await waitForNextUpdate();
    const result = hookReturnRef.current;

    // Assert
    expect(result).toEqual({
      status: "Ready",
      state: "https://storage.googleapis.com/test-bucket/path/to/example.txt?downloadToken=somevalue",
    });
  });

  it("handles errors", async () => {
    // Act
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() =>
      useFileDownloadUrl({ file, provider: mockProvider })
    );
    getDownloadUrlForFileController.reject(new Error("Something went wrong"));
    await waitForNextUpdate();
    const result = hookReturnRef.current;

    // Assert
    expect(reportError).toHaveBeenCalled();
    expect(result).toEqual({ status: "Error", state: null, error: new Error("Something went wrong") });
  });
});
