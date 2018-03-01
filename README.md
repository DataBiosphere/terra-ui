# Saturn UI
This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

Guide [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).

Dev is up [here](https://bvdp-saturn-dev.appspot.com/).

Builds/deploying handled by CircleCI.


### Developing

1. We use node@8 (the current LTS). On Darwin with Homebrew:

    ```sh
    brew install node@8; brew link node@8 --force
    ```
2. Update npm:

    ```sh
    npm install -g npm
    ```
3. Install deps:

    ```sh
    npm install
    ```
4. Start development server:

    ```sh
    npm start
    ```
5. For now at least, code style is defined for IntelliJ, because it's easiest to be prescriptive, and it's the most proactively helpful IDE. When you open the project, go to `Settings -> Editor -> Code Style -> Javascript`, click the gear next to `Scheme`, and import [js-style.xml](js-style.xml).
