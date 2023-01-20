# syntax=docker/dockerfile:1

FROM python:3.10

COPY requirements.txt requirements.txt
RUN /usr/local/bin/python -m pip install --upgrade pip \
    && pip3 install -r requirements.txt

WORKDIR /light

CMD [ "python3", "-m" , "manage", "runserver", "0.0.0.0:8000"]