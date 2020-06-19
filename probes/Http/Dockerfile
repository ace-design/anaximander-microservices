FROM golang:1.14-alpine

RUN apk add --no-cache git

RUN mkdir -p /srv/probe
WORKDIR /srv/probe

COPY . /srv/probe
RUN go build -o probe cmd/run.go

RUN apk del git

CMD /srv/probe/probe
