FROM library/node:14.16-alpine
MAINTAINER Gilles Perreymond <gilles.perreymond@metronlab.com>

# Automatic arguments pass from circleCI
ARG GITLAB_SHA1

# Declare some hardcode environment vars for the image
ENV APP_LAST_COMMIT=${GITLAB_SHA1}

RUN apk add --update bash

# Prepare the destination
RUN mkdir -p /usr/app
WORKDIR /usr/app

# Add source files
COPY . /usr/app

# Root user used in docker:dind during CI, cf https://docs.npmjs.com/misc/config
RUN npm config set unsafe-perm true

# Make the install in the container to avoid compilation problems
RUN yarn install --production && \
    yarn autoclean --init && \
    yarn autoclean --force

# Clean image
RUN npm uninstall -g npm && \
    rm -rf /tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp

# Start application
ENTRYPOINT ["./docker-entrypoint.sh"]
