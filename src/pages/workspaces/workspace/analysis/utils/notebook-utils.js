import _ from "lodash/fp";
import { Fragment, useState } from "react";
import { div, h } from "react-hyperscript-helpers";
import { ButtonPrimary, IdContainer, Select, spinnerOverlay } from "src/components/common";
import { ValidatedInput } from "src/components/input";
import Modal from "src/components/Modal";
import { Ajax } from "src/libs/ajax";
import { reportError } from "src/libs/error";
import { FormLabel } from "src/libs/forms";
import * as Utils from "src/libs/utils";
import { addExtensionToNotebook } from "src/pages/workspaces/workspace/analysis/utils/file-utils";
import validate from "validate.js";

export const analysisNameValidator = (existing) => ({
  presence: { allowEmpty: false },
  format: {
    pattern: /^[^@#$%*+=?,[\]:;/\\]*$/,
    message: h(Fragment, [
      div({ key: "message" }, ["Name can't contain these characters:"]),
      div({ key: "characters", style: { margin: "0.5rem 1rem" } }, ["@ # $ % * + = ? , [ ] : ; / \\ "]),
    ]),
  },
  exclusion: {
    within: existing,
    message: "already exists",
  },
});

export const analysisNameInput = ({ inputProps, ...props }) =>
  h(ValidatedInput, {
    ...props,
    inputProps: {
      ...inputProps,
      autoFocus: true,
      placeholder: "Enter a name",
    },
  });

const baseNotebook = {
  cells: [{ cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: [] }],
  nbformat: 4,
  nbformat_minor: 2,
};

export const notebookData = {
  python3: _.merge(
    {
      metadata: {
        kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
      },
    },
    baseNotebook
  ),
  r: _.merge(
    {
      metadata: {
        kernelspec: { display_name: "R", language: "R", name: "ir" },
        language_info: {
          codemirror_mode: "r",
          file_extension: ".r",
          mimetype: "text/x-r-source",
          name: "R",
          pygments_lexer: "r",
          version: "3.3.3",
        },
      },
    },
    baseNotebook
  ),
};

export const baseRmd = "---\ntitle: Title\nauthor: Name\ndate: Date\n---";

export const NotebookCreator = ({ reloadList, onSuccess, onDismiss, googleProject, bucketName, existingNames }) => {
  const [notebookName, setNotebookName] = useState("");
  const [notebookKernel, setNotebookKernel] = useState(undefined);
  const [creating, setCreating] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const errors = validate(
    { notebookName, notebookKernel },
    {
      notebookName: analysisNameValidator(existingNames),
      notebookKernel: { presence: { allowEmpty: false } },
    },
    { prettify: (v) => ({ notebookName: "Name", notebookKernel: "Language" }[v] || validate.prettify(v)) }
  );

  return h(
    Modal,
    {
      onDismiss,
      title: "Create New Notebook",
      okButton: h(
        ButtonPrimary,
        {
          disabled: creating || errors,
          tooltip: Utils.summarizeErrors(errors),
          onClick: async () => {
            setCreating(true);
            try {
              await Ajax().Buckets.notebook(googleProject, bucketName, addExtensionToNotebook(notebookName)).create(notebookData[notebookKernel]);
              reloadList();
              onSuccess(notebookName, notebookKernel);
            } catch (error) {
              await reportError("Error creating notebook", error);
              onDismiss();
            }
          },
        },
        "Create Notebook"
      ),
    },
    [
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            h(FormLabel, { htmlFor: id, required: true }, ["Name"]),
            analysisNameInput({
              error: Utils.summarizeErrors(nameTouched && errors?.notebookName),
              inputProps: {
                id,
                value: notebookName,
                onChange: (v) => {
                  setNotebookName(v);
                  setNameTouched(true);
                },
              },
            }),
          ]),
      ]),
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            h(FormLabel, { htmlFor: id, required: true }, ["Language"]),
            h(Select, {
              id,
              isSearchable: true,
              placeholder: "Select a language",
              getOptionLabel: ({ value }) => _.startCase(value),
              value: notebookKernel,
              onChange: ({ value: notebookKernel }) => setNotebookKernel(notebookKernel),
              options: ["python3", "r"],
            }),
          ]),
      ]),
      creating && spinnerOverlay,
    ]
  );
};

// In Python notebook, use ' instead of " in code cells, to avoid formatting problems.
// Changes from raw .ipynb:
// - In notebook cells, change \n to \\n
//   (This must be done manually because there is no way to distinguish
//   between a line break and the "\n" character.)
export const cohortNotebook = (cohortName) => `
{
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Getting started working with a cohort\\n",
    "\\n",
    "This notebook demonstrates how to get started in working with a cohort\\n",
    "that has been exported from Data Explorer or any other cohort builder\\n",
    "that exports cohorts in the same format.\\n",
    "\\n",
    "This notebook will:\\n",
    "\\n",
    "* retrieve the participant ids for the cohort\\n",
    "* retrieve some data for those participant ids\\n",
    "* perform a basic data visualization on a column of the retreived data\\n",
    "\\n",
    "To get started, select \`Cell\` and then \`Run All\` from the Jupyter menu above."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "COHORT = '${cohortName}'"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Setup"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Import dependent libraries\\n",
    "\\n",
    "import firecloud.api as fapi      # To get the cohort definition from the workspace\\n",
    "import matplotlib.pyplot as plt   # To plot results\\n",
    "import os                         # To interact with the Jupyter process' environment\\n",
    "import pandas as pd               # For dataframes\\n",
    "import pprint                     # For better output\\n",
    "\\n",
    "# Get the name of the workspace in order to get the cohort definition\\n",
    "NAMESPACE = os.environ['WORKSPACE_NAMESPACE']\\n",
    "WORKSPACE = os.environ['WORKSPACE_NAME']"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Get the cohort definition"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Load the cohort definition from the workspace\\n",
    "cohort_attributes = fapi.get_entity(namespace=NAMESPACE,\\n",
    "                                    workspace=WORKSPACE,\\n",
    "                                    etype='cohort',\\n",
    "                                    ename=COHORT).json()['attributes']\\n",
    "\\n",
    "# Show the elements of the cohort\\n",
    "cohort_attributes.keys()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Query the cohort\\n",
    "\\n",
    "We'll use the cohort SQL query to retrieve the participant ids from BigQuery\\n",
    "and load them into a data frame.\\n",
    "\\n",
    "## Get the query from the cohort"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "cohort_query = cohort_attributes['query']\\n",
    "\\n",
    "print(cohort_query)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Query the participant IDs from BigQuery"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "cohort_participant_ids = pd.read_gbq(cohort_query)\\n",
    "\\n",
    "cohort_participant_ids.shape"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Display a few rows"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "cohort_participant_ids.head()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# List associated BigQuery tables\\n",
    "\\n",
    "When the cohort is exported, Data Explorer includes the paths to other tables\\n",
    "in the associated dataset. Let's list them here."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "bigquery_table_attributes_all_datasets = [entity['attributes'] for entity in fapi.get_entities(\\n",
    "    namespace=NAMESPACE,\\n",
    "    workspace=WORKSPACE,\\n",
    "    etype='BigQuery_table').json()]\\n",
    "\\n",
    "pprint.pprint(bigquery_table_attributes_all_datasets)"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Simplify the returned structure to just be a list of tables\\n",
    "\\n",
    "bigquery_tables = [attr['table_name'] for attr in bigquery_table_attributes_all_datasets\\n",
    "                   if 'dataset_name' in attr and attr['dataset_name'] == cohort_attributes['dataset_name']]\\n",
    "\\n",
    "bigquery_tables"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Join cohort participant ids against a table\\n",
    "\\n",
    "With the cohort SQL, we can now ask BigQuery for other data of interest.\\n",
    "For this demonstration, we will query data from the first table in the dataset. \\n",
    "\\n",
    "Since we have the SQL for our cohort, we will perform the JOIN server-side so that we can download only data relevant to our cohort."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "print(f'JOIN column: \`{cohort_participant_ids.columns[0]}\`.')"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Prepare the query\\n",
    "\\n",
    "**Note:** The query below has \`LIMIT 1000\` so that it runs quickly if the cohort happens to be very large. Modify or remove that line if you wish to retreive more data for your cohort."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "query = f'''\\n",
    "SELECT\\n",
    "  *\\n",
    "FROM \`{bigquery_tables[0]}\`\\n",
    "WHERE\\n",
    "  {cohort_participant_ids.columns[0]} IN ({cohort_query})\\n",
    "LIMIT 1000\\n",
    "'''\\n",
    "\\n",
    "print(query)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Query the data"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "cohort = pd.read_gbq(query)\\n",
    "\\n",
    "cohort.shape"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## View the data"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "cohort.head()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Visualize data\\n",
    "\\n",
    "This section demonstrates how to plot data in a data frame.\\n",
    "\\n",
    "The code below attempts to find the first non-empty, non-id column in the table."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "col_to_plot = cohort.columns[0]\\n",
    "for col in cohort.columns:\\n",
    "    if col.endswith(('id', 'Id', 'ID')):\\n",
    "        continue\\n",
    "    if cohort[col].count() != 0:  # Plot a non-empty column.\\n",
    "        col_to_plot = col\\n",
    "        break\\n",
    "\\n",
    "title = f'Plot of {col_to_plot} for cohort \\"{COHORT}\\"'\\n",
    "print(title)"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "plt.rcParams.update({'font.size': 14})\\n",
    "\\n",
    "if pd.api.types.is_numeric_dtype(cohort[col_to_plot]):\\n",
    "    cohort[col_to_plot].plot(kind='hist', title=title)\\n",
    "else:\\n",
    "    cohort[col_to_plot].value_counts().plot(kind='bar', title=title)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Provenance"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "from datetime import datetime\\n",
    "\\n",
    "print(datetime.now())"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "%%bash\\n",
    "pip3 freeze"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "Copyright 2020 The Broad Institute, Inc., Verily Life Sciences, LLC All rights reserved.\\n",
    "\\n",
    "This software may be modified and distributed under the terms of the BSD license. See the LICENSE file for details."
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.7.6"
  },
  "toc": {
   "base_numbering": 1,
   "nav_menu": {},
   "number_sections": true,
   "sideBar": true,
   "skip_h1_title": false,
   "title_cell": "Table of Contents",
   "title_sidebar": "Contents",
   "toc_cell": false,
   "toc_position": {
    "height": "calc(100% - 180px)",
    "left": "10px",
    "top": "150px",
    "width": "226px"
   },
   "toc_section_display": true,
   "toc_window_display": true
  }
 },
 "nbformat": 4,
 "nbformat_minor": 2
}
`;

export const cohortRNotebook = (cohortName) => `
{
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Getting started working with a cohort\\n",
    "\\n",
    "This notebook demonstrates how to get started in working with a cohort\\n",
    "that has been exported from Data Explorer or any other cohort builder\\n",
    "that exports cohorts in the same format.\\n",
    "\\n",
    "This notebook will:\\n",
    "\\n",
    "* retrieve the participant ids for the cohort\\n",
    "* retrieve some data for those participant ids\\n",
    "* perform a basic data visualization on a column of the retreived data\\n",
    "\\n",
    "To get started, select \`Cell\` and then \`Run All\` from the Jupyter menu above."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "COHORT <- '${cohortName}'"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Setup"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Import dependent libraries\\n",
    "\\n",
    "library(bigrquery)                # R client for BigQuery\\n",
    "library(reticulate)               # Call Python code from R used to get the cohort definition from the workspace\\n",
    "library(tidyverse)                # Data wrangling and plotting\\n",
    "\\n",
    "# Get the name of the workspace in order to get the cohort definition\\n",
    "NAMESPACE <- Sys.getenv('WORKSPACE_NAMESPACE')\\n",
    "WORKSPACE <- Sys.getenv('WORKSPACE_NAME')\\n",
    "\\n",
    "BILLING_PROJECT_ID <- Sys.getenv('GOOGLE_PROJECT')"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Get the cohort definition"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Load the cohort definition from the workspace\\n",
    "fapi <- import('firecloud.api')\\n",
    "\\n",
    "cohort_attributes <- fapi$get_entity(namespace = NAMESPACE,\\n",
    "                                     workspace = WORKSPACE,\\n",
    "                                     etype = 'cohort',\\n",
    "                                     ename = COHORT)$json()$attributes\\n",
    "\\n",
    "# Show the elements of the cohort\\n",
    "names(cohort_attributes)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Query the cohort\\n",
    "\\n",
    "We'll use the cohort SQL query to retrieve the participant ids from BigQuery\\n",
    "and load them into a data frame.\\n",
    "\\n",
    "## Get the query from the cohort"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "cohort_query <- cohort_attributes$query\\n",
    "\\n",
    "print(cohort_query)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Query the participant IDs from BigQuery"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "cohort_participant_ids <- bq_table_download(bq_project_query(BILLING_PROJECT_ID, cohort_query))\\n",
    "\\n",
    "dim(cohort_participant_ids)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Display a few rows"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "head(cohort_participant_ids)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# List associated BigQuery tables\\n",
    "\\n",
    "When the cohort is exported, Data Explorer includes the paths to other tables\\n",
    "in the associated dataset. Let's list them here."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "(bigquery_table_attributes_all_datasets <- map(\\n",
    "    fapi$get_entities(namespace = NAMESPACE, workspace = WORKSPACE, etype = 'BigQuery_table')$json(),\\n",
    "    function(entity) { entity$attributes }))"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Simplify the returned structure to just be a list of tables\\n",
    "\\n",
    "(bigquery_tables = map(\\n",
    "    bigquery_table_attributes_all_datasets,\\n",
    "    function(attr) { \\n",
    "        if ('dataset_name' %in% names(attr) && attr$dataset_name == cohort_attributes$dataset_name) {\\n",
    "            return(attr$table_name)\\n",
    "        }})) %>% compact()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Join cohort participant ids against a table\\n",
    "\\n",
    "With the cohort SQL, we can now ask BigQuery for other data of interest.\\n",
    "For this demonstration, we will query data from the first table in the dataset. \\n",
    "\\n",
    "Since we have the SQL for our cohort, we will perform the JOIN server-side so that we can download only data relevant to our cohort."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "print(str_glue('JOIN column: \`{colnames(cohort_participant_ids)[1]}\`.'))"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Prepare the query\\n",
    "\\n",
    "**Note:** The query below has \`LIMIT 1000\` so that it runs quickly if the cohort happens to be very large. Modify or remove that line if you wish to retreive more data for your cohort."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "query = str_glue('\\n",
    "SELECT\\n",
    "  *\\n",
    "FROM \`{bigquery_tables[1]}\`\\n",
    "WHERE\\n",
    "  {colnames(cohort_participant_ids)[1]} IN ({cohort_query})\\n",
    "LIMIT 1000\\n",
    "')\\n",
    "\\n",
    "print(query)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Query the data"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "cohort <- bq_table_download(bq_project_query(BILLING_PROJECT_ID, query))\\n",
    "\\n",
    "dim(cohort)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## View the data"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "head(cohort)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Visualize data\\n",
    "\\n",
    "This section demonstrates how to plot data in a data frame.\\n",
    "\\n",
    "The code below attempts to find the first non-empty, non-id column in the table."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "col_to_plot = colnames(cohort)[1]\\n",
    "for (col in colnames(cohort)) {\\n",
    "    if (str_ends(col, 'id|Id|ID')) { next }\\n",
    "    if (0 < sum(!is.na(cohort[[col]]))) {  # Plot a non-empty column.\\n",
    "        col_to_plot <- col\\n",
    "        break\\n",
    "    }\\n",
    "}\\n",
    "\\n",
    "title <- str_glue('Plot of {col_to_plot} for cohort \\"{COHORT}\\"')\\n",
    "print(title)"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "theme_set(theme_bw(base_size = 18))\\n",
    "options(repr.plot.height = 8, repr.plot.width = 16)\\n",
    "\\n",
    "qplot(x = cohort[[col_to_plot]], main = title)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Provenance"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "devtools::session_info()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "Copyright 2020 The Broad Institute, Inc., Verily Life Sciences, LLC All rights reserved.\\n",
    "\\n",
    "This software may be modified and distributed under the terms of the BSD license. See the LICENSE file for details."
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "R",
   "language": "R",
   "name": "ir"
  },
  "language_info": {
   "codemirror_mode": "r",
   "file_extension": ".r",
   "mimetype": "text/x-r-source",
   "name": "R",
   "pygments_lexer": "r",
   "version": "3.6.2"
  },
  "toc": {
   "base_numbering": 1,
   "nav_menu": {},
   "number_sections": true,
   "sideBar": true,
   "skip_h1_title": false,
   "title_cell": "Table of Contents",
   "title_sidebar": "Contents",
   "toc_cell": false,
   "toc_position": {
    "height": "calc(100% - 180px)",
    "left": "10px",
    "top": "150px",
    "width": "226px"
   },
   "toc_section_display": true,
   "toc_window_display": true
  }
 },
 "nbformat": 4,
 "nbformat_minor": 2
}
`;
