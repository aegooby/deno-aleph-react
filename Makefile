
clean:
	rm -rf .deno

install:
	curl -fsSL https://deno.land/x/install/install.sh | sh

image:
	docker build -t aegooby/server .

container:
	docker run -it --init -p 80:8000 aegooby/server:latest

cache: export DENO_DIR=.deno/cache
cache:
	[ -d .deno/cache ] || mkdir -p .deno/cache
	deno cache --import-map import-map.json --unstable server.tsx

bundle: export DENO_DIR=.deno/cache
bundle:
	[ -d .deno ] || make cache
	deno bundle client/client.tsx --import-map import-map.json --config client/tsconfig.json --unstable .deno/client.js

start: export DENO_DIR=.deno/cache
start:
	[ -d .deno ] || make cache
	make bundle
	deno run --allow-all --import-map import-map.json --unstable server.tsx
