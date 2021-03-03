
FROM ubuntu:latest

RUN apt-get update
RUN apt-get install -y ca-certificates curl unzip make certbot --no-install-recommends

# @todo HTTPS
# RUN mkdir -p /webroot
# RUN certbot certonly --webroot --webroot-path /webroot

# Server
ENV DENO_INSTALL=/root/.deno
ENV PATH="$DENO_INSTALL/bin:$PATH"
ADD . .
RUN make install-deno
RUN make cache

CMD [ "make", "start-docker" ]
