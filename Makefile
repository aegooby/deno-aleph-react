
# ------------------------------------------------------------------------------
# Default
# ------------------------------------------------------------------------------
version:
	@echo "\033[0;1mhttps\033[0maurus v1.0.0"

# ------------------------------------------------------------------------------
# Reset
# ------------------------------------------------------------------------------
clean:
	rm -rf .cache/ .dist/ node_modules/

# ------------------------------------------------------------------------------
# Deno
# ------------------------------------------------------------------------------
install:
	hash deno || curl -fsSL https://deno.land/x/install/install.sh | sh
	hash yarn || npm install --global yarn

upgrade:
	deno upgrade

# ------------------------------------------------------------------------------
# Setup
# ------------------------------------------------------------------------------
cache: export DENO_DIR=.cache/
cache: upgrade
	mkdir -p .cache/
	deno cache --unstable **/*.tsx
	yarn install

bundle: export DENO_DIR=.cache/
bundle: upgrade cache
	mkdir -p .dist/
	deno bundle --config client/tsconfig.json --unstable client/bundle.tsx .dist/deno.bundle.js

# ------------------------------------------------------------------------------
# Run
# ------------------------------------------------------------------------------
localhost: export DENO_DIR=.cache/
localhost: cache bundle
	(trap 'kill 0' SIGINT; \
		deno bundle --watch --config client/tsconfig.json --unstable client/bundle.tsx .dist/deno.bundle.js & \
		yarn run webpack --watch --env GRAPHQL_API_ENDPOINT=https://localhost:8443/graphql & \
		deno run --watch --allow-all --unstable server/daemon.tsx --hostname localhost --tls cert/localhost/ \
	)

remote: export DENO_DIR=.cache/
remote: cache bundle
	@echo "\033[0;1;31m[!] TLS will not work without a certified domain\033[0m "
	yarn run webpack --env GRAPHQL_API_ENDPOINT=https://example.com/graphql
	deno upgrade --version 1.7.0
	deno run --allow-all --unstable server/daemon.tsx --hostname 0.0.0.0 --tls cert/0.0.0.0/

test: export DENO_DIR=.cache/
test: cache
	deno test --allow-all --unstable tests/

# ------------------------------------------------------------------------------
# Docker 
# ------------------------------------------------------------------------------
prune:
	docker container prune --force
	docker image prune --force

docker:
	docker build --tag httpsaurus/server .
	docker run -itd --init -p 443:8443 -p 80:8080 httpsaurus/server:latest make remote