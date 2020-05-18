#!/usr/bin/env bash
set -e
. ./scripts/common.sh

npm run build
npm run ci
