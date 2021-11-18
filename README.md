### Submit an issue [here](https://broadworkbench.atlassian.net/secure/CreateIssueDetails!init.jspa?pid=10023&issuetype=10004&priority=2)

------------------------

# Terra UI
Web user interface for the Terra platform.

------------------------
### Links:
[Support](https://support.terra.bio/hc/en-us)
[Email an issue](mailto:terra-support@broadinstitute.zendesk.com)
[Board and backlog](https://broadworkbench.atlassian.net/projects/SATURN/issues?filter=allopenissues&orderby=status%20DESC)

-----------------------

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

Guide [here](https://github.com/facebook/create-react-app/blob/master/packages/cra-template/template/README.md).

Builds/deploying handled by CircleCI.

### Feature requests
Requests related to the funtionality or usability of the UI can be submitted as issues on this repo. However, as features often impact multiple components of the Terra platform, we recommend users submit feature requests through the main Terra feature request [page](https://support.terra.bio/hc/en-us/community/topics/360000500452). See this [article](https://support.terra.bio/hc/en-us/community/posts/360040112171) for more details.

### Developing

1. We use Node 14 (the current LTS) and Yarn. On Darwin with Homebrew:

    ```sh
    brew install node@14 yarn; brew link node@14 --force --overwrite
    ```
2. Install deps:

    ```sh
    yarn install
    ```
3. Start development server, which will report any lint violations as well:

    ```sh
    yarn start
    ```

    If you get an error that resembles:

    ```
    Failed to compile.

    ./node_modules/react-dev-utils/webpackHotDevClient.js
    Error: [BABEL] /Users/.../terra-ui/node_modules/react-scripts/node_modules/react-dev-utils/webpackHotDevClient.js: Cannot find module '...'
    Require stack:
    - ...
    - ...
    - ... (While processing: "...js")
    ```

    try:

    ```sh
    rm -rf node_modules
    yarn install
    yarn start
    ```
4. Testing:

    ```sh
    yarn test
    ```
6. Code style and linting:
    * On command line within the repo's root dir: `yarn lint`
      * Eslint will fix as many violations as possible. It will report any that it can't fix itself.
    * In an IDE other than IntelliJ (VS Code, etc): install the eslint plugin from your package manager, and there should be a command to fix issues at any time.
    * In IntelliJ:
        * Styles should be automatically applied by [.editorconfig](.editorconfig); make sure you've also [turned on eslint](https://www.jetbrains.com/help/idea/eslint.html#ws_js_eslint_automatic_configuration).
        * In order to correctly format a file at any time, run the IntelliJ `Reformat Code` action, and then right-click in a window and click `Fix ESLint Problems`. You could also create an IntelliJ macro to do this for you as explained [here](https://www.jetbrains.com/help/idea/using-macros-in-the-editor.html#reformat_on_save), and map running of the macro to a keyboard shortcut for convenience.


### Additional Documentation
See [the wiki](https://github.com/DataBiosphere/terra-ui/wiki).
