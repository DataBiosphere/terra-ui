FROM gcr.io/google-appengine/nodejs

# Node 16 is required.
RUN install_node v16

# Copy application code.
COPY . /app/

# Install production dependencies.
RUN yarn install --immutable-cache

# Build the app.
RUN yarn build

# App port forwarding.
EXPOSE 8080

# Use yarn to host the app.
CMD yarn start
