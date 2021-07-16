
FROM ubuntu:latest

# Setup
ENV DEBIAN_FRONTEND="noninteractive"
RUN apt-get update
RUN apt-get install -y curl unzip nodejs npm git --no-install-recommends

# Deno
RUN curl -fsSL https://deno.land/x/install/install.sh | DENO_INSTALL=/usr/local sh

# Yarn & Node
RUN npm install --global yarn
RUN npm install --global n
RUN n latest

# DGraph
RUN curl -sSf https://get.dgraph.io | bash
WORKDIR /root/ratel
RUN curl -s https://github.com/dgraph-io/ratel/releases/latest | cut -d '"' -f 2 | cut -d / -f 8 >> latest-tag.txt
RUN curl -LOJ https://github.com/dgraph-io/ratel/releases/download/$(cat latest-tag.txt)/dgraph-ratel-linux.tar.gz
RUN tar -xzvf dgraph-ratel-linux.tar.gz
RUN mv ratel /usr/local/bin/
WORKDIR /root
