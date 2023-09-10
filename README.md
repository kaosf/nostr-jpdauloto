# Nostrquiz (JP DAU Loto)

Prepare config files.

```sh
mkdir config

nvim config/nsec.txt # Input nsec1...
chmod 600 config/nsec.txt

nvim config/relays.txt # Input relay URLs
# Example
<<EOF
wss://nostr.example.com
wss://another-relay.example.com
# wss://invalid-relay.example.com
# The line starting with # is ignored.
wss://third-relay.example.com
EOF
```

Prepare data files.

```sh
mkdir data

nvim data/prediction.txt # Input your prediction
# Write only the number

# e.g.
cat data/prediction.txt
#=> 123

touch data/answered-ids.txt
# Quiz event ids are recorded automatically.

# You can edit it manually.
nvim data/answered-ids.txt

# e.g.
cat data/answered-ids.txt
#=>
# 8bfc1950c8c9ba3f8c2ea9a9247bb1d1dc7efe332ee2237cc9d8c742618e7b63
# 73fcbfca4e3ec76e204808df639330ad2b484e98ad097456f8481c9c58fbc602
# 08e06175beee7304e0f4a6624c1efd2fe680e20bf33e985764bdd67958d5c503
```

Run a container.

```sh
docker run -d \
-v $PWD/config:/workspace/config \
-v $PWD/data:/workspace/data \
-u $UID \
kaosf/nostr-jpdauloto:latest

# or
# docker run ... kaosf/nostr-jpdauloto:1.0.0
```

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (C) 2023 ka
