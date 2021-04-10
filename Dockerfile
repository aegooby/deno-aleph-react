
FROM ubuntu:latest

# Setup
RUN apt-get update
RUN apt-get install -y curl unzip make ca-certificates certbot nodejs npm --no-install-recommends

# Deno
ENV DENO_INSTALL=/root/.deno
ENV PATH="$DENO_INSTALL/bin:$PATH"
ADD . /root/httpsaurus
WORKDIR /root/httpsaurus
RUN curl -fsSL https://deno.land/x/install/install.sh | sh
