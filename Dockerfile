FROM node:lts-slim

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Install deps
RUN yarn install --immutable-cache
RUN npm install --location=global serve # to serve the app

# Build the app
RUN DISABLE_ESLINT_PLUGIN=true yarn build # already linted above

# Copy app config to root dir
COPY config/emay.json build/config.json

EXPOSE 8080

CMD npx serve build -l 8080
