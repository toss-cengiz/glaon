ARG BUILD_FROM
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

ENV LANG=C.UTF-8

# nginx serves the web bundle on Ingress; nodejs runs the relay agent (#348)
# alongside it. Both processes are supervised by run.sh — no s6-overlay yet.
# `su-exec` (#351) is used to drop privileges from the boot-time root context
# down to the unprivileged `glaon` user before exec'ing the Node agent. nginx
# itself stays as the addon's entrypoint pid 1 (root); it self-drops worker
# processes via the `user` directive in its own config when needed.
# hadolint ignore=DL3018
RUN apk add --no-cache nginx nodejs su-exec \
    && addgroup -S glaon \
    && adduser -S -G glaon -h /var/empty -s /sbin/nologin glaon

COPY rootfs /
COPY dist /var/www/glaon
COPY agent /opt/glaon/agent

# Static agent code is read-only for the agent user; ownership stays root.
RUN chmod a+x /run.sh \
    && chown -R root:glaon /opt/glaon/agent \
    && chmod -R u=rwX,g=rX,o= /opt/glaon/agent

EXPOSE 8099

CMD ["/run.sh"]
