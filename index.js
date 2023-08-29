import { SimplePool, finishEvent, nip19 } from "nostr-tools";
import "websocket-polyfill";
import { readFileSync } from "fs";
import { DateTime } from "luxon";

const relays = readFileSync("./relays.txt", "utf-8")
  .split("\n")
  .filter((x) => !x.match(/^#/))
  .filter((x) => !(x === ""));
const privKey = nip19.decode(readFileSync("./nsec.txt", "utf-8").trim()).data;

const kojiraPubKey =
  "b3e43e8cc7e6dff23a33d9213a3e912d895b1c3e4250240e0c99dbefe3068b5f";

const now = Math.floor(Date.now() / 1000);

const pool = new SimplePool();

const sub = pool.sub(relays, [
  {
    kinds: [1],
    authors: [kojiraPubKey],
    since: now - 1 * 60 * 60,
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

const detectQuizPost = (event) => {
  const hour = DateTime.fromSeconds(event.created_at).setZone(
    "Asia/Tokyo"
  ).hour;
  if (hour !== 0) {
    return false;
  }

  const content = event.content;
  if (content.match(/第\d+回Nostrくいず/)) {
    return true;
  } else {
    return false;
  }
};

sub.on("event", async (event) => {
  if (!detectQuizPost(event)) return;

  console.log(event);
  const replyId = event.id;
  const prediction = predictDau();
  if (prediction < 0) {
    console.log(`Error! prediction: ${prediction}`);
    return;
  }

  console.log(`Prediction: ${prediction}`);
  const content = `${prediction}`;
  const ev = finishEvent(
    {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["e", replyId, "", "root"],
        ["p", kojiraPubKey],
      ],
      content,
    },
    privKey
  );
  console.log(new Date(), "Before publish allSettled");
  await Promise.allSettled(pool.publish(relays, ev));
  console.log(new Date(), "After publish allSettled");
});
