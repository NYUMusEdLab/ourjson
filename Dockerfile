FROM node:4.2.4-wheezy
MAINTAINER Asyrique Thevendran <asyrique@gmail.com>

RUN mkdir /srv/src
ADD http://repo.mongodb.org/apt/debian/dists/wheezy/mongodb-org/3.2/main/binary-amd64/mongodb-org-tools_3.2.0_amd64.deb /srv/src
RUN dpkg -i /srv/src/mongodb-org-tools_3.2.0_amd64.deb
COPY . /srv/app
WORKDIR /srv/app
RUN npm install
EXPOSE 8080
CMD ["npm", "start"]
