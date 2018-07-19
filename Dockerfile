FROM node:8.9 as node

WORKDIR /usr/ng-sandstorm/
RUN npm install pm2 -g
ENV PM2_PUBLIC_KEY XXXX
ENV PM2_SECRET_KEY YYYY
RUN git clone https://github.com/Evolvus/evolvus-sandstorm-ng-ui.git

WORKDIR /usr/ng-sandstorm/evolvus-sandstorm-ng-ui/
RUN npm install -g @angular/cli typescript uws
RUN npm  i --save
RUN ng build --prod --build-optimizer
RUN ls -a


WORKDIR /usr/ng-sandstorm/
COPY package*.json ./
COPY .npmrc ./
RUN npm install --only=production

COPY . .

RUN cp -r /usr/ng-sandstorm/evolvus-sandstorm-ng-ui/dist/ui-console/*.* /usr/ng-sandstorm/public

#default environment variables
ENV NODE_ENV production
ENV PORT 8086
EXPOSE 8086
CMD ["pm2-runtime", "npm", "--", "start"]