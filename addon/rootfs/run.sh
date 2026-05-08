#!/usr/bin/with-contenv bashio
set -euo pipefail

bashio::log.info "Starting Glaon add-on..."

# Relay agent: bridges HA WebSocket to the Glaon cloud relay (#348). Boots only
# when the operator has paired the addon (cloud_url + home_id + relay_secret all
# present in /data/options.json). The agent process is forked into the
# background; nginx remains the foreground process so the addon container's
# liveness still keys on the web server.
if [ -f /opt/glaon/agent/agent.cjs ]; then
  cloud_url="$(bashio::config 'cloud_url' '')"
  home_id="$(bashio::config 'home_id' '')"
  relay_secret="$(bashio::config 'relay_secret' '')"
  if [ -n "$cloud_url" ] && [ -n "$home_id" ] && [ -n "$relay_secret" ]; then
    bashio::log.info "Starting relay agent..."
    node /opt/glaon/agent/agent.cjs &
  else
    bashio::log.info "Relay agent skipped — addon not paired yet."
  fi
fi

exec nginx -g 'daemon off;'
