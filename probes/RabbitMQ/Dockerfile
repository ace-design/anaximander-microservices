FROM maven:3-openjdk-11

RUN mkdir -p /srv/probe
WORKDIR /srv/probe

COPY . /srv/probe/

RUN mvn clean compile assembly:single

CMD java -jar target/rabbitmq-probe-1.0-SNAPSHOT-jar-with-dependencies.jar
