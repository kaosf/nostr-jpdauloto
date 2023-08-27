import { SimplePool } from "nostr-tools";
import "websocket-polyfill";
import { readFileSync } from "fs";
import { execSync } from "child_process";

const relays = readFileSync("./relays.txt", "utf-8")
  .split("\n")
  .filter((x) => !x.match(/^#/))
  .filter((x) => !(x === ""));

const kojiraPubkey =
  "b3e43e8cc7e6dff23a33d9213a3e912d895b1c3e4250240e0c99dbefe3068b5f";

const now = Math.floor(Date.now() / 1000);

const pool = new SimplePool();

const sub = pool.sub(relays, [
  {
    kinds: [1],
    authors: [kojiraPubkey],
    since: now - 1 * 60 * 60,
    "#t": "nostrquiz",
  },
]);

const predictDau = () => {
  const ret = parseInt(readFileSync("./prediction.txt", "utf-8").trim());
  if (isNaN(ret)) {
    console.log("Error! parse result is NaN.");
    return -1;
  }
  return ret;
};

sub.on("event", (event) => {
  console.log(event);
  const replyId = event.id;
  const prediction = predictDau();
  if (prediction < 0) {
    console.log(`Error! prediction: ${prediction}`);
    return;
  }

  const stdout = execSync(`node publish.js ${replyId} ${prediction}`);
  console.log(stdout.toString());
});
