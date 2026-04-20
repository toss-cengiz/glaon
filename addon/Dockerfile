ARG BUILD_FROM
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

ENV LANG=C.UTF-8

RUN apk add --no-cache nginx

COPY rootfs /
COPY dist /var/www/glaon

RUN chmod a+x /run.sh

EXPOSE 8099

CMD ["/run.sh"]
