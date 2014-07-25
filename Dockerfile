FROM phusion/baseimage:0.9.12
MAINTAINER Andris Reinman

# Use private repository for installing Node
# The official nodejs version is terribly out of date
RUN add-apt-repository -y ppa:chris-lea/node.js

RUN apt-get update
RUN apt-get upgrade -y

# Install all required packages
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

# Install Haraka
RUN npm install -g smtp-test-server
RUN useradd smtptest

# Add runit services and start these
ADD ./docker/svc /etc/service
CMD ["/sbin/my_init"]

EXPOSE 25

# Remove any temp files
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*