
clean:
	rm -rf .deno

install:
	curl -fsSL https://deno.land/x/install/install.sh | sh

image:
	docker build --tag aegooby/server .

container:
	docker run -it --init -p 80:8000 aegooby/server:latest

https-localhost:
	[ -d .deno/https ] || mkdir -p .deno/https
	printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth" > .deno/https/localhost.tmp
	openssl req -x509 -out .deno/https/localhost.crt -keyout .deno/https/localhost.key -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -extensions EXT -config .deno/https/localhost.tmp
	rm -rf .deno/https/localhost.tmp

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
	[ -d .deno/cache ] || make cache
	[ -d .deno/https ] || make https-localhost
	make bundle
	deno run --allow-all --import-map import-map.json --unstable server.tsx
