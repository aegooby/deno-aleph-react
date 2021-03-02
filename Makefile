
clean:
	rm -rf .deno

install-deno:
	curl -fsSL https://deno.land/x/install/install.sh | sh

install-denon:
	deno install -qAf --unstable https://deno.land/x/denon/denon.ts

image:
	docker build --tag aegooby/server .

container:
	docker run -it --init -p 443:8443 aegooby/server:latest

https:
	[ -d .https ] || mkdir -p .https
	cd .https && minica --domains localhost --ip-addresses 0.0.0.0

cache: export DENO_DIR=.deno/cache
cache:
	[ -d .deno/cache ] || mkdir -p .deno/cache
	deno cache --import-map import-map.json --unstable **/*.tsx main.ts

start-dev: export DENO_DIR=.deno/cache
start-dev:
	[ -d .deno/cache ] || make cache
	[ -d .https ] || make https
	denon --config denon.yml run --allow-all --import-map import-map.json --unstable main.ts --protocol https --hostname localhost --port 8443

start-docker: export DENO_DIR=.deno/cache
start-docker:
	[ -d .deno/cache ] || make cache
	[ -d .https ] || make https
	deno run --allow-all --import-map import-map.json --unstable main.ts --protocol https --hostname 0.0.0.0 --port 8443
