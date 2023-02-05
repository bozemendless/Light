# syntax=docker/dockerfile:1

FROM python:3.10

# install virtualenv
RUN pip3 install virtualenv
RUN virtualenv /env

# ENV
ENV PATH="/env/bin:$PATH"

# install requirements.txt
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

# copy all files and folders to container's current working directory
COPY . .

# set work directory
WORKDIR /light

# run Django app
CMD ["/env/bin/python3", "-m", "manage", "runserver", "0.0.0.0:8000"]