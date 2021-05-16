
FROM aegooby/httpsaurus:base-latest AS httpsaurus

# Dokku
EXPOSE 5080

WORKDIR /root/httpsaurus
ADD . /root/httpsaurus
RUN build/linux upgrade

FROM httpsaurus AS dev

CMD [ "build/linux", "remote", "--target", "dev" ]

FROM httpsaurus AS live

CMD [ "build/linux", "remote", "--target", "live" ]
