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
  # The agent needs read of /opt/glaon/agent (group glaon, mode 0750 — set in
  # the Dockerfile) and rw on /data/options.json. /data is supervisor-owned;
  # chown the options file to the glaon user the first time the agent runs
  # so su-exec can later overwrite it. If the file isn't there yet (unpaired)
  # the chown is a no-op and the FileOptionsStore creates the file at 0600
  # under the glaon user's umask.
  if [ -e /data/options.json ]; then
    chown glaon:glaon /data/options.json || true
    chmod 0600 /data/options.json || true
  fi
  # /data must be searchable by the unprivileged user so it can open
  # options.json by absolute path.
  chmod a+x /data || true
  su-exec glaon node /opt/glaon/agent/agent.cjs &
fi

exec nginx -g 'daemon off;'
