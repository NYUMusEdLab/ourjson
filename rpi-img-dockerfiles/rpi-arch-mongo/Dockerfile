FROM cellofellow/rpi-arch
MAINTAINER asyrique@gmail.com

RUN groupadd -r mongodb && useradd -r -g mongodb mongodb
RUN pacman -Sy
RUN pacman -S --noconfirm ca-certificates curl pcre mongodb mongodb-tools
ADD https://github.com/tianon/gosu/releases/download/1.7/gosu-armhf /bin/gosu
RUN chmod +x /bin/gosu
RUN rm -rf /var/lib/mongodb \
    && mv /etc/mongodb.conf /etc/mongodb.conf.orig

RUN mkdir -p /data/db && chown -R mongodb:mongodb /data/db
VOLUME /data/db

COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 27017
CMD ["mongod", "--journal", "--storageEngine=mmapv1"]
