import { getPopupRoot } from "src/components/popup-utils";

describe("getPopupRoot", () => {
  afterEach(() => {
    document.getElementById("modal-root").remove();
  });

  it("creates root element if it does not exist", () => {
    // Arrange
    expect(document.getElementById("modal-root")).toBeNull();

    // Act
    const popupRoot = getPopupRoot();

    // Assert
    expect(popupRoot).toBeInTheDocument();
  });

  it('adds "complementary" role to root element', () => {
    // Arrange
    const popupRoot = getPopupRoot();

    // Assert
    expect(popupRoot.role).toBe("complementary");
  });

  it("returns root element if it exists", () => {
    // Arrange
    const existingPopupRoot = document.createElement("div");
    existingPopupRoot.id = "modal-root";
    document.body.append(existingPopupRoot);

    // Act
    const popupRoot = getPopupRoot();

    // Assert
    expect(popupRoot).toBe(existingPopupRoot);
  });
});
