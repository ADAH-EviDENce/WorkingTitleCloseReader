FROM golang:1.12-stretch as buildserver

# go-sqlite3 is expensive to compile, so make sure it's cached.
RUN go get github.com/mattn/go-sqlite3

WORKDIR /go/src/github.com/knaw-huc/evidence-gui
COPY *.go schema.sql ./
COPY internal internal

RUN go get -t -v ./...
RUN go test ./...
RUN go install -ldflags="-s" .


FROM node:11-alpine as buildui

WORKDIR /evidence
COPY ui/package.json .
COPY ui/package-lock.json .
COPY ui/tsconfig.json .
COPY ui/public public
COPY ui/src src

RUN npm install
RUN npm run build


FROM debian:buster
RUN apt-get -y update && apt-get -y install sqlite3

WORKDIR /evidence

COPY schema.sql .
RUN mkdir /db
RUN sqlite3 /db/relevance.db < schema.sql
VOLUME /db

COPY --from=buildserver /go/bin/evidence-gui .
COPY --from=buildui /evidence/build ./static

EXPOSE 8080

ENTRYPOINT ["./evidence-gui"]
