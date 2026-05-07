ARG BUILD_FROM
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

ENV LANG=C.UTF-8

# nginx serves the web bundle on Ingress; nodejs runs the relay agent (#348)
# alongside it. Both processes are supervised by run.sh — no s6-overlay yet.
# hadolint ignore=DL3018
RUN apk add --no-cache nginx nodejs

COPY rootfs /
COPY dist /var/www/glaon
COPY agent /opt/glaon/agent

RUN chmod a+x /run.sh

EXPOSE 8099

CMD ["/run.sh"]
