
clean:
	rm -rf .aleph

install:
	deno install -A -f -n aleph https://deno.land/x/aleph@v0.3.0-alpha.1/cli.ts

build:
	aleph build

start-dev:
	open http://localhost:8080
	aleph dev

start-rel:
	open http://localhost:8080
	aleph start