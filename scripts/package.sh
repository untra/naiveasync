#!/usr/bin/env bash
set -e
. ./scripts/common.sh

ONLY_PUSH_ARTIFACT_PATH="pushes"

echo "building naiveasync"
npm run build
if ! bd_isdev ; then
  if [[ ! -z ${ARTIFACT_PATH+x} && ${ARTIFACT_PATH} == ${ONLY_PUSH_ARTIFACT_PATH} ]]; then
    if [[ ${APP_ENV} = "prod" ]]; then
      npm publish --access restricted
    else
      echo "skipping npm publish, will only run for production builds"
    fi
  else
    echo "skipping npm publish, will only run on push builds, not PRs"
  fi
else
  echo "publishing to npm is disabled from developer environments"
fi

cd ${CWD}
