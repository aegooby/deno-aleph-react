export DENO_DIR=.cache/
mkdir -p build/
deno compile --unstable --import-map import-map.json --allow-all --output build/windows --target x86_64-pc-windows-msvc cli/cli.ts
deno compile --unstable --import-map import-map.json --allow-all --output build/macos --target x86_64-apple-darwin cli/cli.ts
deno compile --unstable --import-map import-map.json --allow-all --output build/linux --target x86_64-unknown-linux-gnu cli/cli.ts