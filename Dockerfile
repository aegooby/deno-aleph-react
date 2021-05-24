
FROM aegooby/httpsaurus:base-latest AS httpsaurus

# Dokku
EXPOSE 3080

WORKDIR /root/httpsaurus
ADD . /root/httpsaurus
RUN build/linux upgrade

FROM httpsaurus AS localhost

CMD [ "build/linux", "docker", "--target", "localhost", "--domain", "localhost" ]

FROM httpsaurus AS dev

CMD [ "build/linux", "docker", "--target", "dev", "--domain", "dev.example.com" ]

FROM httpsaurus AS live

CMD [ "build/linux", "docker", "--target", "live", "--domain", "example.com" ]
