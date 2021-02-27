
clean:
	rm -rf .deno-react

bundle:
	deno bundle client/client.tsx --import-map import-map.json --config client/tsconfig.json --unstable client/client.js

start:
	make bundle
	open http://localhost:8080
	deno run --allow-all --import-map import-map.json --unstable server.tsx