import { Ajax } from "src/libs/ajax";
import { getConfig } from "src/libs/config";
import Events from "src/libs/events";
import { getAvailableFeaturePreviews, isFeaturePreviewEnabled, toggleFeaturePreview } from "src/libs/feature-previews";
import { getLocalPref, setLocalPref } from "src/libs/prefs";

jest.mock("src/libs/ajax");
jest.mock("src/libs/config", () => ({
  ...jest.requireActual("src/libs/config"),
  getConfig: jest.fn().mockReturnValue({}),
}));
jest.mock("src/libs/feature-previews-config", () => ({
  __esModule: true,
  default: [
    {
      id: "feature1",
      title: "Feature #1",
      description: "A new feature",
    },
    {
      id: "feature2",
      title: "Feature #2",
      description: "Another new feature",
      groups: ["preview-group"],
    },
  ],
}));
jest.mock("src/libs/prefs");

beforeEach(() => {
  getConfig.mockReturnValue({ isProd: true });
});

describe("isFeaturePreviewEnabled", () => {
  it("reads from local preference", () => {
    getLocalPref.mockReturnValue(true);
    expect(isFeaturePreviewEnabled("test-feature")).toBe(true);
    expect(getLocalPref).toHaveBeenCalledWith("feature-preview/test-feature");
  });
});

describe("toggleFeaturePreview", () => {
  it("sets local preference", () => {
    Ajax.mockImplementation(() => ({ Metrics: { captureEvent: jest.fn() } }));

    toggleFeaturePreview("test-feature", false);
    expect(setLocalPref).toHaveBeenCalledWith("feature-preview/test-feature", false);
  });

  it("captures metrics", () => {
    const captureEvent = jest.fn();
    Ajax.mockImplementation(() => ({ Metrics: { captureEvent } }));

    toggleFeaturePreview("test-feature", true);
    expect(captureEvent).toHaveBeenCalledWith(Events.featurePreviewToggle, { featureId: "test-feature", enabled: true });
  });
});

describe("getAvailableFeaturePreviews", () => {
  it("should return available feature previews based on user's groups", async () => {
    getLocalPref.mockReturnValue(false);

    Ajax.mockImplementation(() => ({
      Groups: {
        list: jest.fn().mockReturnValue(Promise.resolve([])),
      },
    }));

    expect(await getAvailableFeaturePreviews()).toEqual([
      {
        id: "feature1",
        title: "Feature #1",
        description: "A new feature",
      },
    ]);

    Ajax.mockImplementation(() => ({
      Groups: {
        list: jest.fn().mockReturnValue(
          Promise.resolve([
            {
              groupName: "preview-group",
              groupEmail: "preview-group@test.firecloud.org",
              role: "member",
            },
          ])
        ),
      },
    }));

    expect(await getAvailableFeaturePreviews()).toEqual([
      {
        id: "feature1",
        title: "Feature #1",
        description: "A new feature",
      },
      {
        id: "feature2",
        title: "Feature #2",
        description: "Another new feature",
        groups: ["preview-group"],
      },
    ]);
  });

  it("should include enabled feature previews regardless of group", async () => {
    getLocalPref.mockImplementation((key) => key === "feature-preview/feature2");

    Ajax.mockImplementation(() => ({
      Groups: {
        list: jest.fn().mockReturnValue(Promise.resolve([])),
      },
    }));

    expect(await getAvailableFeaturePreviews()).toEqual([
      {
        id: "feature1",
        title: "Feature #1",
        description: "A new feature",
      },
      {
        id: "feature2",
        title: "Feature #2",
        description: "Another new feature",
        groups: ["preview-group"],
      },
    ]);
  });

  it("should include all feature previews in non-production environments", async () => {
    getConfig.mockReturnValue({ isProd: false });
    getLocalPref.mockReturnValue(false);

    Ajax.mockImplementation(() => ({
      Groups: {
        list: jest.fn().mockReturnValue(Promise.resolve([])),
      },
    }));

    expect(await getAvailableFeaturePreviews()).toEqual([
      {
        id: "feature1",
        title: "Feature #1",
        description: "A new feature",
      },
      {
        id: "feature2",
        title: "Feature #2",
        description: "Another new feature",
        groups: ["preview-group"],
      },
    ]);
  });
});
