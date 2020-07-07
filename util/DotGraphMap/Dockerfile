FROM probeutiljs

WORKDIR /srv/util

COPY package*.json ./

RUN npm install

#Bundle App Source
COPY . .

#Run the app
CMD [ "node", "index.js" ]

