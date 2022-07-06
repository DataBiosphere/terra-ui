FROM node:16

RUN set -x \
  && git clone https://github.com/DataBiosphere/terra-ui.git \
  && cd terra-ui \
  && git checkout dev \
  && yarn install --immutable-cache \
  && PUBLIC_URL="." yarn build # to get relative URLs so that it can be load up in proxied environment

FROM us.gcr.io/broad-dsp-gcr-public/base/nginx:stable-alpine
COPY --from=0 /terra-ui/build /usr/share/nginx/html
COPY nginx-bees.conf /etc/nginx/conf.d

# App port forwarding.
EXPOSE 80
