
# ------------------------------------------------------------------------------
# Default
# ------------------------------------------------------------------------------
version:
	@echo "\033[0;1mhttps\033[0maurus v1.0.0"

# ------------------------------------------------------------------------------
# Reset
# ------------------------------------------------------------------------------
clean:
	rm -rf .httpsaurus/
	rm -rf node_modules/

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
cache: export DENO_DIR=.httpsaurus/cache
cache: upgrade
	mkdir -p .httpsaurus/cache
	deno cache --unstable **/*.tsx

bundle: export DENO_DIR=.httpsaurus/cache
bundle: upgrade cache
	mkdir -p .httpsaurus
	deno bundle --config client/tsconfig.json --unstable client/bundle.tsx .httpsaurus/bundle-deno.js
	yarn install
	yarn run babel .httpsaurus/bundle-deno.js --out-file .httpsaurus/bundle-babel.js
	yarn run browserify .httpsaurus/bundle-babel.js -o .httpsaurus/bundle-stupid-safari.js

# ------------------------------------------------------------------------------
# Run
# ------------------------------------------------------------------------------
debug: export DENO_DIR=.httpsaurus/cache
debug: cache bundle
	deno run --allow-all --unstable --watch server/daemon.tsx --hostname localhost --tls cert/localhost/

release: export DENO_DIR=.httpsaurus/cache
release: cache bundle
	deno upgrade --version 1.7.0
	deno run --allow-all --unstable server/daemon.tsx --hostname 0.0.0.0 --tls cert/0.0.0.0/

test: export DENO_DIR=.httpsaurus/cache
test: cache
	deno test --allow-all --unstable tests/

# ------------------------------------------------------------------------------
# Docker 
# ------------------------------------------------------------------------------
prune:
	docker container prune --force
	docker image prune --force

docker: prune
	docker build --tag httpsaurus/server .
	docker run -itd --init -p 443:8443 -p 80:8080 httpsaurus/server:latest