FROM library/node:alpine
LABEL maintainer=Gilles\ Perreymond\ <gilles.perreymond@metronlab.com>

# Automatic arguments pass from circleCI
ARG GITLAB_SHA1

# Declare some hardcode environment vars for the image
ENV APP_LAST_COMMIT=${GITLAB_SHA1}

RUN apk add --update bash p7zip unzip

# Prepare the destination
RUN mkdir -p /usr/app
WORKDIR /usr/app

COPY --chown=node:node package* /usr/app/

# Make the install in the container to avoid compilation problems
RUN yarn install --production && \
    yarn autoclean --init && \
    yarn autoclean --force

# Clean image
RUN npm uninstall -g npm && \
    rm -rf /tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp

# Add source files
COPY --chown=node:node . /usr/app

# Start application
ENTRYPOINT ["./docker-entrypoint.sh"]
