FROM probeutiljs

WORKDIR /srv/probe

COPY package*.json ./

RUN npm install

#Bundle App Source
COPY . .
RUN sed -i 's/\.\.\/\.\.\/util/\.\/util/g' findMongoDBCollections.js

#Run the app
CMD [ "node", "findMongoDBCollections.js" ]

