FROM node:18.10

COPY . /terra-ui/
RUN cd /terra-ui && yarn build

FROM us.gcr.io/broad-dsp-gcr-public/base/nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-bees.conf /etc/nginx/conf.d

COPY --from=0 /terra-ui/build /usr/share/nginx/html

# App port forwarding.
EXPOSE 8080
