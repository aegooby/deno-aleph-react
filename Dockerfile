
FROM ubuntu:latest

RUN apt-get update
RUN apt-get install -y ca-certificates curl unzip make --no-install-recommends
RUN curl -fsSL https://deno.land/x/install/install.sh | sh

ENV DENO_INSTALL=/root/.deno
ENV PATH="$DENO_INSTALL/bin:$PATH"

ADD . .
RUN make cache

CMD [ "make", "start" ]
