
clean:
	rm -rf .httpsaurus

install-deno:
	curl -fsSL https://deno.land/x/install/install.sh | sh

install-denon:
	deno install -qAf --unstable https://deno.land/x/denon/denon.ts

image:
	docker build --tag httpsaurus/server .

container:
	docker run -it --init -p 443:8443 httpsaurus/server:latest

https:
	[ -d .https ] || mkdir -p .https
	cd .https && minica --domains localhost --ip-addresses 0.0.0.0

cache: export DENO_DIR=.httpsaurus/cache
cache:
	[ -d .httpsaurus/cache ] || mkdir -p .httpsaurus/cache
	deno cache --import-map import-map.json --unstable **/*.tsx

start-dev: export DENO_DIR=.httpsaurus/cache
start-dev:
	[ -d .httpsaurus/cache ] || make cache
	[ -d .https ] || make https
	denon --config denon.yml run --allow-all --import-map import-map.json --unstable server/server.tsx --protocol https --hostname localhost --port 8443

start-docker: export DENO_DIR=.httpsaurus/cache
start-docker:
	[ -d .httpsaurus/cache ] || make cache
	[ -d .https ] || make https
	deno run --allow-all --import-map import-map.json --unstable server/server.tsx --protocol https --hostname 0.0.0.0 --port 8443
