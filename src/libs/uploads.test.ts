import { act, renderHook } from "@testing-library/react-hooks";
import { controlledPromise } from "src/testing/test-utils";

import { useUploader } from "./uploads";

describe("useUploader", () => {
  const file1 = new File(["example"], "file1.txt", { type: "text/text" });
  const file2 = new File(["some_content"], "file2.txt", { type: "text/text" });

  it("uploads files", async () => {
    // Arrange
    const uploadFile = jest.fn(() => Promise.resolve());
    const { result: hookReturnRef } = renderHook(() => useUploader(uploadFile));

    // Act
    await act(() => hookReturnRef.current.uploadFiles([file1, file2]));

    // Assert
    expect(uploadFile.mock.calls).toEqual([
      [file1, expect.objectContaining({ signal: expect.any(AbortSignal) })],
      [file2, expect.objectContaining({ signal: expect.any(AbortSignal) })],
    ]);
  });

  it("tracks progress of upload batch", async () => {
    // Arrange
    let finishCurrentUpload: (() => void) | null = null;
    const uploadFile = jest.fn(() => {
      const [promise, controller] = controlledPromise<void>();
      finishCurrentUpload = controller.resolve;
      return promise;
    });

    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useUploader(uploadFile));
    const initialState = hookReturnRef.current.uploadState;

    // Act
    act(() => {
      hookReturnRef.current.uploadFiles([file1, file2]);
    });
    const stateAfterStartingUpload = hookReturnRef.current.uploadState;

    finishCurrentUpload!();
    await waitForNextUpdate();
    const stateAfterFinishingFirstUpload = hookReturnRef.current.uploadState;

    finishCurrentUpload!();
    await waitForNextUpdate();
    const stateAfterFinishingSecondUpload = hookReturnRef.current.uploadState;

    // Assert
    expect(initialState).toEqual({
      active: false,
      totalFiles: 0,
      totalBytes: 0,
      uploadedBytes: 0,
      currentFileNum: 0,
      currentFile: null,
      files: [],
      completedFiles: [],
      errors: [],
      aborted: false,
      done: false,
    });

    expect(stateAfterStartingUpload).toEqual({
      active: true,
      totalFiles: 2,
      totalBytes: 19,
      uploadedBytes: 0,
      currentFileNum: 0,
      currentFile: file1,
      files: [file1, file2],
      completedFiles: [],
      errors: [],
      aborted: false,
      done: false,
    });

    expect(stateAfterFinishingFirstUpload).toEqual({
      active: true,
      totalFiles: 2,
      totalBytes: 19,
      uploadedBytes: 7,
      currentFileNum: 1,
      currentFile: file2,
      files: [file1, file2],
      completedFiles: [file1],
      errors: [],
      aborted: false,
      done: false,
    });

    expect(stateAfterFinishingSecondUpload).toEqual({
      active: false,
      totalFiles: 2,
      totalBytes: 19,
      uploadedBytes: 19,
      currentFileNum: 1,
      currentFile: file2,
      files: [file1, file2],
      completedFiles: [file1, file2],
      errors: [],
      aborted: false,
      done: true,
    });
  });

  it("tracks errors during uploads", async () => {
    // Arrange
    const uploadFile = jest.fn(() => Promise.reject(new Error("Upload error")));
    const { result: hookReturnRef } = renderHook(() => useUploader(uploadFile));

    // Act
    await act(() => hookReturnRef.current.uploadFiles([file1]));

    // Assert
    expect(hookReturnRef.current.uploadState).toEqual({
      active: false,
      totalFiles: 1,
      totalBytes: 7,
      uploadedBytes: 0,
      currentFileNum: 0,
      currentFile: file1,
      files: [file1],
      completedFiles: [],
      errors: [new Error("Upload error")],
      aborted: false,
      done: true,
    });
  });

  it("allows canceling upload", async () => {
    // Arrange
    const uploadFile = jest.fn(() => Promise.resolve());
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useUploader(uploadFile));

    // Act
    act(() => {
      hookReturnRef.current.uploadFiles([file1, file2]);
      hookReturnRef.current.cancelUpload();
    });
    await waitForNextUpdate();

    // Assert
    expect(uploadFile).toHaveBeenCalledTimes(1);

    expect(hookReturnRef.current.uploadState).toEqual({
      active: false,
      totalFiles: 2,
      totalBytes: 19,
      uploadedBytes: 7,
      currentFileNum: 0,
      currentFile: file1,
      files: [file1, file2],
      completedFiles: [file1],
      errors: [],
      aborted: true,
      done: false,
    });
  });
});
