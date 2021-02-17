#!/usr/bin/env bash

source "${BASH_SOURCE%/*}/default-vars.sh"
source "${BASH_SOURCE%/*}/docker-hub-login.sh"

TARGET_RUNTIME_STAGE="$DOCKER_REPO:$DOCKER_TARGET_TAG"

echo "Publishing $RUNTIME_IMAGE_ID to $TARGET_RUNTIME_STAGE"
docker tag "$RUNTIME_IMAGE_ID" "$TARGET_RUNTIME_STAGE"
docker push "$TARGET_RUNTIME_STAGE"
