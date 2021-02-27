
clean:
	rm -rf .deno-react

bundle:
	[ ! -d client/.bundle ] && mkdir client/.bundle
	deno bundle client/client.tsx --import-map import-map.json --config client/tsconfig.json --unstable client/.bundle/client.js

start:
	make bundle
	open http://localhost:8000
	deno run --allow-all --import-map import-map.json --unstable server.tsx