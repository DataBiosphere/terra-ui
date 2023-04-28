import { renderHook } from "@testing-library/react-hooks";
import { Ajax } from "src/libs/ajax";
import { asMockedFn } from "src/testing/test-utils";

import { useMetricsEvent } from "./useMetrics";

type AjaxExports = typeof import("src/libs/ajax");
jest.mock("src/libs/ajax", (): AjaxExports => {
  return {
    ...jest.requireActual("src/libs/ajax"),
    Ajax: jest.fn(),
  };
});

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxMetricsContract = AjaxContract["Metrics"];

describe("useMetricsEvent", () => {
  it("calls event logger", () => {
    // Arrange
    const watchCaptureEvent = jest.fn();
    const mockMetrics: Partial<AjaxMetricsContract> = {
      captureEvent: (event, details) => watchCaptureEvent(event, details),
    };
    const mockAjax: Partial<AjaxContract> = {
      Metrics: mockMetrics as AjaxMetricsContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const renderedHook = renderHook(() => useMetricsEvent());
    const { captureEvent } = renderedHook.result.current;
    captureEvent("hi there", { something: "interesting" });

    // Assert
    expect(watchCaptureEvent).toBeCalledTimes(1);
    expect(watchCaptureEvent).toBeCalledWith("hi there", { something: "interesting" });
  });
});
