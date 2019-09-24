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

Guide [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).

Builds/deploying handled by CircleCI.

### Feature requests
Requests related to the funtionality or usability of the UI can be submitted as issues on this repo. However, as features often impact multiple components of the Terra platform, we recommend users submit feature requests through the main Terra feature request [page](https://support.terra.bio/hc/en-us/community/topics/360000500452). See this [article](https://support.terra.bio/hc/en-us/community/posts/360040112171) for more details.

### Developing

1. We use Node 10 (the current LTS). On Darwin with Homebrew:

    ```sh
    brew install node@10; brew link node@10 --force --overwrite
    ```
2. Update npm:

    ```sh
    npm install -g npm@6.10
    ```
3. Install deps:

    ```sh
    npm install
    ```
4. Start development server, which will report any lint violations as well:

    ```sh
    npm start
    ```
5. Testing:
    
    ```sh
    npm test
    ```
6. Code style:
    * Not in IntelliJ: use an eslint plugin.
    * In IntelliJ: 
        * When you open the project, right-click [.eslintrc.js](.eslintrc.js) and click `Apply Eslint Code Style Rules`; then go to `Preferences -> Editor -> Code Style -> Javascript`, click the gear next to `Scheme` -> `Import Scheme` -> `Intellij IDEA code style XML`, then select [js-style.xml](js-style.xml).
        * In order to correctly format a file at any time, run the IntelliJ `Reformat Code` action, and then right-click in a window and click `Fix ESLint Problems`. You could also create a macro to do this for you.


### Additional Documentation
See [the wiki](https://github.com/DataBiosphere/terra-ui/wiki).
