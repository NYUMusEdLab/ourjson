FROM node:4.2.2
MAINTAINER Asyrique Thevendran <asyrique@gmail.com>

COPY . /srv/app
WORKDIR /srv/app
RUN npm install
EXPOSE 80
CMD ["npm", "start"]
