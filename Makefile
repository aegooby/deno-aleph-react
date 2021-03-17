
# ------------------------------------------------------------------------------
# Default
# ------------------------------------------------------------------------------
version:
	@echo "\033[0;1mhttps\033[0maurus v1.0.0"

# ------------------------------------------------------------------------------
# Reset
# ------------------------------------------------------------------------------
clean:
	rm -rf .httpsaurus

# ------------------------------------------------------------------------------
# Deno
# ------------------------------------------------------------------------------
install:
	curl -fsSL https://deno.land/x/install/install.sh | sh

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
	deno bundle --config client/tsconfig.json --unstable client/bundle.tsx .httpsaurus/bundle.js

# ------------------------------------------------------------------------------
# Run
# ------------------------------------------------------------------------------
debug: export DENO_DIR=.httpsaurus/cache
debug: cache bundle
	deno run --allow-all --unstable --watch server/daemon.tsx --protocol https --hostname localhost --cert cert/localhost/

release: export DENO_DIR=.httpsaurus/cache
release: cache bundle
	deno upgrade --version 1.7.0
	deno run --allow-all --unstable server/daemon.tsx --protocol https --hostname 0.0.0.0 --cert cert/0.0.0.0/

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
	docker run -itd --init -p 443:443 -p 80:80 httpsaurus/server:latest