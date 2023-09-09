# Nostrquiz (JP DAU Loto)

```sh
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

```sh
docker run -d \
-v $PWD/config:/workspace/config \
-v $PWD/data:/workspace/data \
-u $UID \
kaosf/nostr-jpdauloto:1.0.0
```

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (C) 2023 ka
