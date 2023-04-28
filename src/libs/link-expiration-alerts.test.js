import { render } from "@testing-library/react";
import { addDays, addHours, setMilliseconds } from "date-fns/fp";
import _ from "lodash/fp";
import { getLinkExpirationAlerts } from "src/libs/link-expiration-alerts";
import * as Nav from "src/libs/nav";

jest.mock("src/libs/providers", () => [
  {
    key: "anvil",
    name: "NHGRI AnVIL Data Commons Framework Services",
    expiresAfter: 30,
    short: "NHGRI",
  },
]);

describe("getLinkExpirationAlerts", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("NIH link", () => {
    it("includes alert if NIH link has expired", () => {
      const expirationDate = setMilliseconds(0, addDays(-1, new Date()));
      const alerts = getLinkExpirationAlerts({
        nihStatus: {
          linkedNihUsername: "user@example.com",
          linkExpireTime: expirationDate.getTime() / 1000,
        },
      });

      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "nih-link-expiration",
            title: "Your access to NIH Controlled Access workspaces and data has expired.",
          }),
        ])
      );
    });

    it("includes alert if link will expire within the next 24 hours", () => {
      const expirationDate = setMilliseconds(0, addHours(6, new Date()));

      const alerts = getLinkExpirationAlerts({
        nihStatus: {
          linkedNihUsername: "user@example.com",
          linkExpireTime: expirationDate.getTime() / 1000,
        },
      });

      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "nih-link-expiration",
            title: "Your access to NIH Controlled Access workspaces and data will expire soon.",
          }),
        ])
      );
    });

    it("does not show notification if link will not expire within the next 24 hours", () => {
      const expirationDate = setMilliseconds(0, addDays(7, new Date()));

      const alerts = getLinkExpirationAlerts({
        nihStatus: {
          linkedNihUsername: "user@example.com",
          linkExpireTime: expirationDate.getTime() / 1000,
        },
      });

      expect(alerts).toEqual([]);
    });
  });

  describe("fence links", () => {
    beforeEach(() => {
      jest.spyOn(Nav, "getLink").mockReturnValue("fence-callback");
    });

    it("includes alert if link has expired", () => {
      const issueDate = addDays(-90, new Date());

      const alerts = getLinkExpirationAlerts({
        fenceStatus: {
          anvil: {
            username: "user@example.com",
            issued_at: issueDate.toISOString(),
          },
        },
      });

      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "fence-link-expiration/anvil",
            title: "Your access to NHGRI AnVIL Data Commons Framework Services has expired.",
          }),
        ])
      );

      const { message } = _.find({ id: "fence-link-expiration/anvil" }, alerts);
      const { container } = render(message);
      expect(container).toHaveTextContent("Log in to restore your access or unlink your account.");
    });

    it("includes alert if link will expire within the next 5 days", () => {
      const issueDate = addDays(-27, new Date());

      const alerts = getLinkExpirationAlerts({
        fenceStatus: {
          anvil: {
            username: "user@example.com",
            issued_at: issueDate.toISOString(),
          },
        },
      });

      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "fence-link-expiration/anvil",
            title: "Your access to NHGRI AnVIL Data Commons Framework Services will expire in 3 day(s).",
          }),
        ])
      );

      const { message } = _.find({ id: "fence-link-expiration/anvil" }, alerts);
      const { container } = render(message);
      expect(container).toHaveTextContent("Log in to renew your access or unlink your account.");
    });

    it("does not include alert if link will not expire within the next 5 days", () => {
      const alerts = getLinkExpirationAlerts({
        fenceStatus: {
          anvil: {
            username: "user@example.com",
            issued_at: new Date().toISOString(),
          },
        },
      });

      expect(alerts).toEqual([]);
    });
  });
});
