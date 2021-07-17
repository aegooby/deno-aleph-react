
FROM aegooby/httpsaurus:base-latest AS httpsaurus

# Dokku
EXPOSE 3080

WORKDIR /root/httpsaurus
ADD . /root/httpsaurus
RUN cli/install.sh
RUN deno-cli upgrade

FROM httpsaurus AS localhost

CMD [ "deno-cli", "docker", "--target", "localhost", "--domain", "localhost" ]

FROM httpsaurus AS dev

CMD [ "deno-cli", "docker", "--target", "dev", "--domain", "dev.example.com" ]

FROM httpsaurus AS live

CMD [ "deno-cli", "docker", "--target", "live", "--domain", "example.com" ]
