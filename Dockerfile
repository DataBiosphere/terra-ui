FROM node:lts-slim

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Install deps
RUN yarn install --immutable-cache
RUN npm install --location=global serve # to serve the app

# Run the linter
RUN yarn eslint --max-warnings=0 .

# Copy app config to root dir
COPY config/emay.json config.json

# Build the app
RUN DISABLE_ESLINT_PLUGIN=true yarn build # already linted above

EXPOSE 8080

ENTRYPOINT [ "/usr/local/bin/npx", "serve -s build" ]
