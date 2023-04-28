import _ from "lodash/fp";
import { div, h } from "react-hyperscript-helpers";
import { commonPaths } from "src/components/breadcrumbs";
import DataExplorerFrame from "src/components/DataExplorerFrame";
import FooterWrapper from "src/components/FooterWrapper";
import PrivateDataExplorer from "src/components/PrivateDataExplorer";
import TopBar from "src/components/TopBar";
import datasets from "src/data/datasets";
import * as Nav from "src/libs/nav";
import * as Style from "src/libs/style";

const DataExplorerPage = ({ dataset }) => {
  const { authDomain } = _.find({ name: dataset }, datasets);

  return h(FooterWrapper, [
    h(TopBar, { title: "Library", href: Nav.getLink("library-datasets") }, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        div(commonPaths.datasetList()),
        div({ style: Style.breadcrumb.textUnderBreadcrumb }, [`Data Explorer - ${dataset}`]),
      ]),
    ]),
    div({ role: "main", style: { flexGrow: 1 } }, [h(authDomain ? PrivateDataExplorer : DataExplorerFrame, { dataset })]),
  ]);
};

export const navPaths = [
  {
    name: "data-explorer-public",
    path: "/library/datasets/public/:dataset/data-explorer",
    component: DataExplorerPage,
    public: true,
    title: ({ dataset }) => `${dataset} - Data Explorer`,
  },
  {
    name: "data-explorer-private",
    path: "/library/datasets/:dataset/data-explorer",
    component: DataExplorerPage,
    title: ({ dataset }) => `${dataset} - Data Explorer`,
  },
];
