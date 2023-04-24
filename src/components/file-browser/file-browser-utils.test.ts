import { basename, dirname } from "src/components/file-browser/file-browser-utils";

describe("basename", () => {
  it("returns file basename from path", () => {
    expect(basename("path/to/file.txt")).toBe("file.txt");
    expect(basename("file.txt")).toBe("file.txt");
  });

  it("returns directory basename from path", () => {
    expect(basename("path/to/directory/")).toBe("directory");
    expect(basename("directory/")).toBe("directory");

    expect(basename("")).toBe("");
    expect(basename("/")).toBe("");
  });
});

describe("dirname", () => {
  it("returns file dirname from path", () => {
    expect(dirname("path/to/file.txt")).toBe("path/to/");
    expect(dirname("file.txt")).toBe("");
  });

  it("returns directory dirname from path", () => {
    expect(dirname("path/to/directory/")).toBe("path/to/");
    expect(dirname("directory/")).toBe("");

    expect(dirname("")).toBe("");
    expect(dirname("/")).toBe("");
  });
});
