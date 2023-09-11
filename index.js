import { SimplePool, finishEvent, nip19 } from "nostr-tools";
import "websocket-polyfill";
import { readFileSync, appendFileSync } from "fs";
import { DateTime } from "luxon";

const relays = readFileSync("./config/relays.txt", "utf-8")
  .split("\n")
  .filter((x) => !x.match(/^#/))
  .filter((x) => !(x === ""));
const privKey = nip19.decode(
  readFileSync("./config/nsec.txt", "utf-8").trim()
).data;

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
  const ret = parseInt(readFileSync("./data/prediction.txt", "utf-8").trim());
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
  if (hour >= 4) {
    return false;
  }

  const content = event.content;
  if (content.match(/第\d+回Nostrくいず/)) {
    return true;
  } else if (content.match(/Nostr日本語話者/)) {
    return true;
  } else if (content.match(/日本語話者のDAU/)) {
    return true;
  } else if (content.match(/何人でしょう/)) {
    return true;
  } else if (content.match(/従来の計測方法/)) {
    return true;
  } else {
    return false;
  }
};

const isAlreadyAnswered = (id) => {
  const ids = readFileSync("./data/answered-ids.txt", "utf-8")
    .split("\n")
    .filter((x) => x === id);
  return ids.length > 0;
};

const recordAnsweredId = (id) => {
  appendFileSync("./data/answered-ids.txt", `${id}\n`);
  console.log(new Date(), "Recorded event.id:", id);
};

sub.on("event", async (event) => {
  if (!detectQuizPost(event)) return;
  console.log(new Date(), "Detected event.id:", event.id);

  if (isAlreadyAnswered(event.id)) {
    console.log(new Date(), `event.id: ${event.id} already answered.`);
    return;
  }

  const replyId = event.id;
  const prediction = predictDau();
  if (prediction < 0) {
    console.error(new Date(), `Error! prediction: ${prediction}`);
    recordAnsweredId(replyId);
    return;
  }

  console.log(new Date(), "Prediction:", prediction);
  const content = `${prediction}`;
  const created_at = Math.max(
    Math.floor(Date.now() / 1000),
    event.created_at + 1
  );
  const ev = finishEvent(
    {
      kind: 1,
      created_at,
      tags: [
        ["e", replyId, "", "root"],
        ["p", kojiraPubKey],
      ],
      content,
    },
    privKey
  );
  recordAnsweredId(replyId);
  console.log(new Date(), "Before race");
  await Promise.race([
    Promise.allSettled(pool.publish(relays, ev)).then(() => {
      console.log(new Date(), "Done allSettled!");
    }),
    new Promise((resolve) => {
      setTimeout(
        () => {
          console.log(new Date(), "Timeout!");
          resolve();
        },
        10 * 60 * 1000
      );
    }),
  ]);
  console.log(new Date(), "After race");
});
