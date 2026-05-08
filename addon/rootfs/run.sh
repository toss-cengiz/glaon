#!/usr/bin/with-contenv bashio
set -euo pipefail

bashio::log.info "Starting Glaon add-on..."

# Agent process always runs — it hosts both the relay bridge (#348) and the
# /pair Ingress UI (#349). When the addon is unpaired the supervisor loop
# stays in IDLE; the pair surface stays reachable on /pair via nginx so the
# user can submit a code. After /pair/claim succeeds the loop wakes up and
# dials the cloud relay using the freshly-written credentials in
# /data/options.json. nginx remains the foreground process so the addon
# container's liveness still keys on the web server.
if [ -f /opt/glaon/agent/agent.cjs ]; then
  bashio::log.info "Starting relay agent + pair surface..."
  node /opt/glaon/agent/agent.cjs &
fi

exec nginx -g 'daemon off;'
