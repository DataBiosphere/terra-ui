import { fireEvent, getByText, render } from "@testing-library/react";
import _ from "lodash/fp";
import { h } from "react-hyperscript-helpers";
import Alerts from "src/components/Alerts";
import { useServiceAlerts } from "src/libs/service-alerts";
import * as Utils from "src/libs/utils";

jest.mock("src/libs/service-alerts", () => {
  const originalModule = jest.requireActual("src/libs/service-alerts");
  return {
    ...originalModule,
    useServiceAlerts: jest.fn(),
  };
});

const testAlerts = [
  {
    id: "abc",
    title: "The systems are down!",
    message: "Something is terribly wrong",
  },
  {
    id: "def",
    title: "Scheduled maintenance",
    message: "Offline tomorrow",
  },
];

describe("Alerts", () => {
  beforeEach(() => {
    useServiceAlerts.mockReturnValue(testAlerts);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders number of alerts", () => {
    const { getByRole } = render(h(Alerts));
    expect(getByRole("button")).toHaveTextContent(`${testAlerts.length}`);
  });

  it("renders popup with alerts", () => {
    const { getByRole, getAllByTestId } = render(h(Alerts));
    fireEvent.click(getByRole("button"));

    const alerts = getAllByTestId("alert");
    expect(alerts.length).toBe(testAlerts.length);

    _.forEach(([index, testAlert]) => {
      expect(getByText(alerts[index], testAlert.title)).toBeTruthy();
      expect(getByText(alerts[index], testAlert.message)).toBeTruthy();
    }, Utils.toIndexPairs(testAlerts));
  });

  it("renders alerts for screen readers", () => {
    const { getAllByRole } = render(h(Alerts));
    const screenReaderAlerts = getAllByRole("alert");

    expect(screenReaderAlerts.length).toBe(testAlerts.length);

    _.forEach(([index, testAlert]) => {
      expect(getByText(screenReaderAlerts[index], testAlert.title)).toBeTruthy();
      expect(getByText(screenReaderAlerts[index], testAlert.message)).toBeTruthy();

      expect(screenReaderAlerts[index]).toHaveClass("sr-only");
    }, Utils.toIndexPairs(testAlerts));
  });

  it("renders message when there are no alerts", () => {
    useServiceAlerts.mockReturnValue([]);

    const { getByRole } = render(h(Alerts));
    fireEvent.click(getByRole("button"));

    expect(getByRole("dialog")).toHaveTextContent("No system alerts at this time.");
  });
});
