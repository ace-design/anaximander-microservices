FROM python:3.8-alpine

RUN mkdir -p /srv/probe
WORKDIR /srv/probe

COPY requirements.txt /srv/probe/
COPY swagger.py /srv/probe/

RUN pip install -r requirements.txt

CMD python /srv/probe/swagger.py
