import _ from "lodash/fp";
import { div, h } from "react-hyperscript-helpers";
import { Clickable } from "src/components/common";
import { icon } from "src/components/icons";
import colors from "src/libs/colors";
import { useStore, withDisplayName } from "src/libs/react-utils";
import { toggleStateAtom } from "src/libs/state";

const viewToggleStyles = {
  toolbarContainer: {
    flex: "none",
    display: "flex",
  },
  toolbarButton: (active) => ({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 3,
    border: `1px solid ${colors.accent()}`,
    height: "2.25rem",
    padding: "0 .75rem",
    color: colors.accent(),
    backgroundColor: active ? colors.accent(0.2) : "white",
  }),
};

export const ViewToggleButtons = ({ listView, setListView }) => {
  return div({ style: viewToggleStyles.toolbarContainer }, [
    h(
      Clickable,
      {
        style: { marginLeft: "auto", ...viewToggleStyles.toolbarButton(!listView) },
        onClick: () => setListView(false),
        tooltip: "Card view",
      },
      [icon("view-cards", { size: 24, style: { margin: ".3rem" } })]
    ),
    h(
      Clickable,
      {
        style: { marginLeft: "1rem", ...viewToggleStyles.toolbarButton(listView) },
        onClick: () => setListView(true),
        tooltip: "List view",
      },
      [icon("view-list", { size: 24, style: { margin: ".3rem" } })]
    ),
  ]);
};

export const useViewToggle = (key) => {
  const toggleState = useStore(toggleStateAtom) || {};
  return [toggleState[key], (v) => toggleStateAtom.update(_.set(key, v))];
};

export const withViewToggle = (key) => (WrappedComponent) => {
  return withDisplayName("withViewToggle", (props) => {
    const [listView, setListView] = useViewToggle(key);
    return h(WrappedComponent, { ...props, listView, setListView });
  });
};
