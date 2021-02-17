#!/usr/bin/env bash

DOCKER_REPO="${DOCKER_REPO:-peaceman/discord-cc-price-announcer}"

source "${BASH_SOURCE%/*}/determine-target-tag.sh"
