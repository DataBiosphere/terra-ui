import { addDays } from "date-fns/fp";
import { store } from "react-notifications-component";
import * as Notifications from "src/libs/notifications";
import * as Preferences from "src/libs/prefs";
import { notificationStore } from "src/libs/state";

jest.mock("react-notifications-component", () => {
  return {
    store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.spyOn(Preferences, "getLocalPref");
});

afterEach(() => {
  jest.restoreAllMocks();
  notificationStore.reset();
});

describe("notify", () => {
  it("adds notification to stores", () => {
    Notifications.notify("info", "Test notification", {
      id: "test-notification",
      message: "This is only a test",
    });
    expect(notificationStore.get()).toEqual([
      expect.objectContaining({
        id: "test-notification",
        type: "info",
        title: "Test notification",
        message: "This is only a test",
      }),
    ]);
    expect(store.addNotification).toHaveBeenCalledWith(expect.objectContaining({ id: "test-notification" }));
  });

  it("does not add notification to store if notification is muted", () => {
    Preferences.getLocalPref.mockImplementation((key) => {
      return key === "mute-notification/test-notification" ? Date.now() + 1 : undefined;
    });
    Notifications.notify("info", "Test notification", { id: "test-notification" });
    expect(notificationStore.get()).toEqual([]);
    expect(store.addNotification).not.toHaveBeenCalled();
  });
});

describe("clearNotification", () => {
  it("removes notification from react-notifications-component store", () => {
    Notifications.clearNotification("test-notification");
    expect(store.removeNotification).toHaveBeenCalledWith("test-notification");
  });
});

describe("clearMatchingNotifications", () => {
  it("clears all notifications in store with IDs matching prefix", () => {
    notificationStore.set([{ id: "category1/foo" }, { id: "category1/bar" }, { id: "category2/foo" }]);
    Notifications.clearMatchingNotifications("category1/");
    expect(store.removeNotification.mock.calls).toEqual([["category1/foo"], ["category1/bar"]]);
  });
});

describe("isNotificationMuted", () => {
  it("reads mute preference", () => {
    Notifications.isNotificationMuted("test-notification");
    expect(Preferences.getLocalPref).toHaveBeenCalledWith("mute-notification/test-notification");
  });

  it("returns false if no mute preference is set", () => {
    Preferences.getLocalPref.mockReturnValue(undefined);
    const isMuted = Notifications.isNotificationMuted("test-notification");
    expect(isMuted).toBe(false);
  });

  it("returns true if mute preference is set to -1", () => {
    Preferences.getLocalPref.mockReturnValue(-1);
    const isMuted = Notifications.isNotificationMuted("test-notification");
    expect(isMuted).toBe(true);
  });

  it("returns false if mute preference is before current time", () => {
    Preferences.getLocalPref.mockReturnValue(Date.now() - 1);
    const isMuted = Notifications.isNotificationMuted("test-notification");
    expect(isMuted).toBe(false);
  });

  it("returns true if mute preference is after current time", () => {
    Preferences.getLocalPref.mockReturnValue(Date.now() + 1);
    const isMuted = Notifications.isNotificationMuted("test-notification");
    expect(isMuted).toBe(true);
  });
});

describe("muteNotification", () => {
  beforeEach(() => {
    jest.spyOn(Preferences, "setLocalPref");
  });

  it("sets preference", () => {
    const tomorrow = addDays(1, new Date()).getTime();
    Notifications.muteNotification("test-notification", tomorrow);
    expect(Preferences.setLocalPref).toHaveBeenCalledWith("mute-notification/test-notification", tomorrow);
  });

  it("defaults to -1 if no until argument is provided", () => {
    Notifications.muteNotification("test-notification");
    expect(Preferences.setLocalPref).toHaveBeenCalledWith("mute-notification/test-notification", -1);
  });
});
