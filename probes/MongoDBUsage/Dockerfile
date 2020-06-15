FROM node:10.13.0

#CreateApp Workdir
RUN mkdir -p /srv/probe
WORKDIR /srv/probe

COPY package*.json ./

RUN npm install

#Bundle App Source
COPY . .

#Run the app
CMD [ "node", "index.js" ]

