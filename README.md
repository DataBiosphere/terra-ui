# Saturn UI
This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

Guide [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).

Builds/deploying handled by CircleCI.


### Developing

1. We use node@8 (the current LTS). On Darwin with Homebrew:

    ```sh
    brew install node@8; brew link node@8 --force
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
See [the wiki](https://github.com/DataBiosphere/saturn-ui/wiki).
