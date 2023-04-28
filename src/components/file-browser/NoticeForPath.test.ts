import { render } from "@testing-library/react";
import { h } from "react-hyperscript-helpers";

import { NoticeForPath } from "./NoticeForPath";

describe("NoticeForPath", () => {
  const notices = {
    "foo/": "foo notice",
    "foo/bar/": "foo/bar notice",
  };

  it.each([
    { path: "foo/", expectedNotice: "foo notice" },
    { path: "foo/bar/baz/", expectedNotice: "foo/bar notice" },
  ])("renders notice with longest matching path", ({ path, expectedNotice }) => {
    const { container } = render(h(NoticeForPath, { notices, path }));
    expect(container).toHaveTextContent(expectedNotice);
  });

  it("renders nothing if no notice matches path", () => {
    const { container } = render(h(NoticeForPath, { notices, path: "/" }));
    expect(container).toBeEmptyDOMElement();
  });
});
