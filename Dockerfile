FROM node:4.2.2
MAINTAINER Asyrique Thevendran <asyrique@gmail.com>

COPY . /srv/app
WORKDIR /srv/app
RUN npm install
EXPOSE 8080
CMD ["npm", "start"]
