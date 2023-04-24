import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { h } from "react-hyperscript-helpers";
import { Ajax } from "src/libs/ajax";
import { reportError } from "src/libs/error";
import { history } from "src/libs/nav";
import * as Nav from "src/libs/nav";
import { WorkspaceWrapper } from "src/libs/workspace-utils";
import { BillingProjectActions } from "src/pages/billing/List/BillingProjectActions";
import { asMockedFn } from "src/testing/test-utils";

type AjaxContract = ReturnType<typeof Ajax>;
jest.mock("src/libs/ajax");

type WorkspaceUtilsExports = typeof import("src/components/workspace-utils");
jest.mock("src/components/workspace-utils", (): WorkspaceUtilsExports => {
  return {
    ...jest.requireActual("src/components/workspace-utils"),
    useWorkspaces: jest.fn(),
  };
});

type ModalExports = typeof import("src/components/Modal");
jest.mock("src/components/Modal", (): ModalExports => {
  const { mockModalModule } = jest.requireActual("src/components/Modal.mock");
  return mockModalModule();
});

type ErrorExports = typeof import("src/libs/error");
jest.mock(
  "src/libs/error",
  (): ErrorExports => ({
    ...jest.requireActual("src/libs/error"),
    reportError: jest.fn(),
  })
);

describe("BillingProjectActions", () => {
  const verifyDisabled = (item) => expect(item).toHaveAttribute("disabled");
  const verifyEnabled = (item) => expect(item).not.toHaveAttribute("disabled");
  const deleteProjectMock = jest.fn(() => Promise.resolve());
  const projectName = "testProject";
  const propsWithNoWorkspacesInProject = {
    projectName,
    loadProjects: jest.fn(),
    workspacesLoading: false,
    allWorkspaces: [
      {
        workspace: {
          namespace: "aDifferentProject",
          name: "testWorkspaces",
          workspaceId: "6771d2c8-cd58-47da-a54c-6cdafacc4175",
        },
        accessLevel: "WRITER",
      },
    ] as WorkspaceWrapper[],
  };

  beforeEach(() => {
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: { deleteProject: deleteProjectMock } as Partial<AjaxContract["Billing"]>,
        } as Partial<AjaxContract> as AjaxContract)
    );

    Nav.history.replace({ search: "initial" });
  });

  it("renders Delete as disabled while workspaces are loading", () => {
    // Arrange
    const props = {
      projectName,
      loadProjects: jest.fn(),
      workspacesLoading: true,
      allWorkspaces: undefined,
    };

    // Act
    render(h(BillingProjectActions, props));

    // Assert
    const deleteButton = screen.getByLabelText("Cannot delete billing project while workspaces are loading");
    verifyDisabled(deleteButton);
  });

  it("renders Delete as disabled if project has workspaces", () => {
    // Arrange
    const props = {
      projectName,
      loadProjects: jest.fn(),
      workspacesLoading: false,
      allWorkspaces: [
        {
          workspace: {
            namespace: projectName,
            name: "testWorkspaces",
            workspaceId: "6771d2c8-cd58-47da-a54c-6cdafacc4175",
          },
          accessLevel: "WRITER",
        },
      ] as WorkspaceWrapper[],
    };

    // Act
    render(h(BillingProjectActions, props));

    // Assert
    const deleteButton = screen.getByLabelText("Cannot delete billing project because it contains workspaces");
    verifyDisabled(deleteButton);
  });

  it("renders Delete as enabled if project has no workspaces", () => {
    // Arrange -- common setup implements mock with no workspaces for project

    // Act
    render(h(BillingProjectActions, propsWithNoWorkspacesInProject));

    // Assert
    const deleteButton = screen.getByLabelText(`Delete billing project ${projectName}`);
    verifyEnabled(deleteButton);
  });

  it("calls the server to delete a billing project", async () => {
    // Arrange
    const loadProjects = jest.fn();
    propsWithNoWorkspacesInProject.loadProjects = loadProjects;

    // Act
    render(h(BillingProjectActions, propsWithNoWorkspacesInProject));
    const deleteButton = screen.getByLabelText(`Delete billing project ${projectName}`);
    await userEvent.click(deleteButton);
    const confirmDeleteButton = screen.getByTestId("confirm-delete");
    await userEvent.click(confirmDeleteButton);

    // Assert
    expect(deleteProjectMock).toHaveBeenCalledWith(projectName);
    expect(loadProjects).toHaveBeenCalledTimes(1);
    expect(history.location.search).toBe("");
  });

  it("does not call the server to delete a billing project if the user cancels", async () => {
    // Arrange
    const loadProjects = jest.fn();
    propsWithNoWorkspacesInProject.loadProjects = loadProjects;

    // Act
    render(h(BillingProjectActions, propsWithNoWorkspacesInProject));
    const deleteButton = screen.getByLabelText(`Delete billing project ${projectName}`);
    await userEvent.click(deleteButton);
    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);

    // Assert
    expect(deleteProjectMock).not.toHaveBeenCalled();
    expect(loadProjects).not.toHaveBeenCalled();
    expect(history.location.search).toBe("?initial");
  });

  it("handles errors from deleting a billing project", async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: { deleteProject: jest.fn().mockRejectedValue({ status: 500 }) } as Partial<AjaxContract["Billing"]>,
        } as Partial<AjaxContract> as AjaxContract)
    );
    const loadProjects = jest.fn();
    propsWithNoWorkspacesInProject.loadProjects = loadProjects;

    // Act
    render(h(BillingProjectActions, propsWithNoWorkspacesInProject));
    const deleteButton = screen.getByLabelText(`Delete billing project ${projectName}`);
    await userEvent.click(deleteButton);
    const confirmDeleteButton = screen.getByTestId("confirm-delete");
    await userEvent.click(confirmDeleteButton);

    // Assert
    expect(history.location.search).toBe("?initial");
    expect(loadProjects).not.toHaveBeenCalled();
    expect(reportError).toHaveBeenCalled();
  });
});
