FROM node:8-alpine

#
# User ID changed to 99 since the default (1000) conflicts with some developer machines.
# from https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md
#

RUN deluser --remove-home node \
  && addgroup -S node -g 99 \
  && adduser -S -g node -u 99 node

#
# install gcloud tools
# from https://github.com/GoogleCloudPlatform/cloud-sdk-docker/blob/master/alpine/Dockerfile
#

ENV CLOUD_SDK_VERSION 194.0.0

ENV PATH /google-cloud-sdk/bin:$PATH

RUN apk --no-cache add \
        curl \
        python \
        py-crcmod \
        bash \
        libc6-compat \
        openssh-client \
        git \
    && curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-${CLOUD_SDK_VERSION}-linux-x86_64.tar.gz && \
    tar xzf google-cloud-sdk-${CLOUD_SDK_VERSION}-linux-x86_64.tar.gz && \
    rm google-cloud-sdk-${CLOUD_SDK_VERSION}-linux-x86_64.tar.gz && \
    ln -s /lib /lib64 && \
    gcloud config set core/disable_usage_reporting true && \
    gcloud config set component_manager/disable_update_check true && \
    gcloud config set metrics/environment github_docker_image

#
# Configuration
#

RUN mkdir /w
WORKDIR /w
