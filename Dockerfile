
FROM ubuntu:latest

RUN apt-get update
# RUN apt-get install -y build-essential curl file git unzip make ca-certificates certbot --no-install-recommends
RUN apt-get install -y curl unzip make ca-certificates certbot --no-install-recommends
# RUN /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"



# @todo HTTPS

# Server
ENV DENO_INSTALL=/root/.deno
ENV PATH="$DENO_INSTALL/bin:$PATH"
ADD . .
RUN make install-deno
RUN make cache

# CMD [ "make", "start-docker" ]
