#!/usr/bin/env bash
set -euo pipefail

dx agent start

dx halo create testhalo
dx space create
key=$(dx space list --json | jq -r '.[] | .key')

if [[ -z "$key" ]]; then
  echo "space was not created"
  exit 2
fi
