FROM node:18-alpine

# Firebase Emulator Java gerektiriyor
RUN apk add --no-cache openjdk17-jre-headless

RUN npm install -g firebase-tools@13.6.0

WORKDIR /firebase

COPY firebase.json .
COPY database.rules.json .
COPY .firebaserc .

EXPOSE 9000 4000

CMD ["firebase", "emulators:start", "--only", "database,ui", "--project", "demo-aidep"]
