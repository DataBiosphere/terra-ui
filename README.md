# Terra UI
Web user interface for the Terra platform.

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

Guide [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).

Builds/deploying handled by CircleCI.

### Feature requests
Requests related to the funtionality or usability of the UI can be submitted as issues on this repo. However, as features often impact multiple components of the Terra platform, we recommend users submit feature requests through the main Terra feature request [page](https://broadinstitute.zendesk.com/hc/en-us/community/topics/360000500452-Feature-Requests). See this [article](https://broadinstitute.zendesk.com/hc/en-us/community/posts/360040112171-Welcome-to-the-Feature-Request-section-) for more details.

### Developing

1. We use node@8 (the current LTS). On Darwin with Homebrew:

    ```sh
    brew install node@10; brew link node@10 --force --overwrite
    ```
2. Update npm:

    ```sh
    npm install -g npm@6
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
    * In IntelliJ: when you open the project, go to `Settings -> Editor -> Code Style -> Javascript`, click the gear next to `Scheme`, and import [js-style.xml](js-style.xml); then close Settings and right-click [.eslintrc.js](.eslintrc.js) and click `Apply Eslint Code Style Rules`.


### Additional Documentation
See [the wiki](https://github.com/DataBiosphere/terra-ui/wiki).
