#!/usr/bin/env bash
#
# exports docker image hash as RUNTIME_IMAGE_ID

source "${BASH_SOURCE%/*}/default-vars.sh"

set -euo pipefail

RUNTIME_IMAGE_ID_FILE=$(mktemp)

docker pull "$DOCKER_REPO":"$DOCKER_TARGET_TAG" || true

# build the runtime stage
docker build \
    --iidfile "$RUNTIME_IMAGE_ID_FILE" \
    --file Dockerfile \
    --cache-from "$DOCKER_REPO":"$DOCKER_TARGET_TAG" \
    .

export RUNTIME_IMAGE_ID=$(cat "$RUNTIME_IMAGE_ID_FILE")

rm "$RUNTIME_IMAGE_ID_FILE"
