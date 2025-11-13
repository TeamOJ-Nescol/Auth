FROM node:18-alpine

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install
RUN npm install -g @nestjs/cli

ENV NODE_ENV="development"
ENV PORT=4000
ENV JWT_SECRET="KerianRossIsOurPresident"

COPY prisma ./prisma/
RUN npx prisma db push
RUN npx prisma generate

COPY . .

RUN npm install

EXPOSE 4000

CMD ["npm", "run", "start"]