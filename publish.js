import {
  SimplePool,
  nip19,
  getEventHash,
  getPublicKey,
  getSignature,
} from "nostr-tools";
import "websocket-polyfill";
import { readFileSync } from "fs";

const relays = readFileSync("./relays.txt", "utf-8")
  .split("\n")
  .filter((x) => !x.match(/^#/))
  .filter((x) => !(x === ""));
const privkey = nip19.decode(readFileSync("./nsec.txt", "utf-8").trim()).data;
const pubkey = getPublicKey(privkey);
const kojiraPubkey =
  "b3e43e8cc7e6dff23a33d9213a3e912d895b1c3e4250240e0c99dbefe3068b5f";

const replyId = parseInt(process.argv[2]);
const prediction = process.argv[3];
console.log(`Prediction: ${prediction}`);

const content = `${prediction}`;
const ev = {
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ["e", replyId, "", "root"],
    ["p", kojiraPubkey],
  ],
  content,
  pubkey,
};
ev.id = getEventHash(ev);
ev.sig = getSignature(ev, privkey);

const pool = new SimplePool();
pool.publish(relays, ev);
console.log("Done publish.");
