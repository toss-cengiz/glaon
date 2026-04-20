#!/usr/bin/with-contenv bashio
set -euo pipefail

bashio::log.info "Starting Glaon add-on..."
exec nginx -g 'daemon off;'
