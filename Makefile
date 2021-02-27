
clean:
	rm -rf .deno

bundle:
	[ -d .deno ] || mkdir .deno
	deno bundle client/client.tsx --import-map import-map.json --config client/tsconfig.json --unstable .deno/client.js

start:
	make bundle
	deno run --allow-all --import-map import-map.json --unstable server.tsx