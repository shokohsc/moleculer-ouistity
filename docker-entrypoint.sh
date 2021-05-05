#!/bin/bash
set -e

# Start application
echo "Start application"

exec node_modules/.bin/moleculer-runner --config moleculer.config.js "$@"
