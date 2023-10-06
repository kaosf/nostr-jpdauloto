import { Event, SimplePool, finishEvent, nip19 } from "nostr-tools";
import "websocket-polyfill";
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { DateTime } from "luxon";

const relays = readFileSync("./config/relays.txt", "utf-8")
  .split(/\n|\r\n|\r/)
  .filter((x) => !x.match(/^#/))
  .filter((x) => !(x === ""));
const privKey = nip19.decode(readFileSync("./config/nsec.txt", "utf-8").trim()).data as string;

const kojiraPubKey = "b3e43e8cc7e6dff23a33d9213a3e912d895b1c3e4250240e0c99dbefe3068b5f";

const now = Math.floor(Date.now() / 1000);

const pool = new SimplePool();

const sub = pool.sub(relays, [
  {
    kinds: [1],
    authors: [kojiraPubKey],
    since: now - 1 * 60 * 60,
  },
]);

type QuizType = "jadau" | "endau" | "frdau" | "dedau" | "kodau" | "??dau";
type IsNotQuiz = undefined;
const isNotQuiz: IsNotQuiz = undefined;
type DetectionResult = IsNotQuiz | QuizType;

const predictDau = (quizType: QuizType) => {
  let filepath = "";
  switch (quizType) {
    case "jadau":
      filepath = "./data/prediction.txt";
      break;
    case "endau":
      filepath = "./data/prediction-en.txt";
      break;
    case "frdau":
      return Math.floor(100 + Math.random() * 50); // 😇
    case "dedau":
      return Math.floor(150 + Math.random() * 80); // 😇
    case "kodau":
      return Math.floor(80 + Math.random() * 50); // 😇
    case "??dau":
      return Math.floor(Math.random() * 300); // 😇
    default:
      console.log(new Date(), "Something went wrong in predictDau. Invalid QuizType; quizType:", quizType);
      return -1;
  }
  const ret = parseInt(readFileSync(filepath, "utf-8").trim());
  if (isNaN(ret)) {
    console.log("Error! parse result is NaN.");
    return -1;
  }
  return ret;
};

const detectQuizPost = (event: Event): DetectionResult => {
  const hour = DateTime.fromSeconds(event.created_at).setZone("Asia/Tokyo").hour;
  if (hour >= 4) {
    return isNotQuiz;
  }

  const content = event.content;
  if (content.match(/ピタリ/) && content.match(/ニアピン/) && content.match(/何人/) && content.match(/まで受付/)) {
    if (content.match(/Nostr日本語話者/)) {
      return "jadau";
    } else if (content.match(/Nostr英語話者/)) {
      return "endau";
    } else if (content.match(/Nostrフランス語話者/)) {
      return "frdau";
    } else if (content.match(/Nostrドイツ語話者/)) {
      return "dedau";
    } else if (content.match(/Nostr韓国語話者/)) {
      return "kodau";
    } else if (content.match(/Nostr.{1,50}語話者/)) {
      return "??dau";
    } else {
      return isNotQuiz;
    }
  } else {
    return isNotQuiz;
  }
};

const isAlreadyAnswered = (id: string) => {
  const ids = readFileSync("./data/answered-ids.txt", "utf-8")
    .split("\n")
    .filter((x) => x === id);
  return ids.length > 0;
};

const isAlreadyAnsweredToday = (now: DateTime) => {
  const s = readFileSync("./data/latest-answered-date.txt", "utf-8").trim();
  const latestAnsweredDate = DateTime.fromFormat(s, "yyyy-MM-dd");
  return now.startOf("day") <= latestAnsweredDate.startOf("day");
};

const recordAnsweredId = (id: string) => {
  appendFileSync("./data/answered-ids.txt", `${id}\n`);
  console.log(new Date(), "Recorded event.id:", id);
};

const recordLatestAnsweredDate = (now: DateTime) => {
  const date = now.toFormat("yyyy-MM-dd");
  writeFileSync("./data/latest-answered-date.txt", `${date}\n`);
  console.log(new Date(), "Recorded latest answered date:", date);
};

sub.on("event", async (event) => {
  const detectionResult = detectQuizPost(event);
  switch (detectionResult) {
    case isNotQuiz:
      return;
  }
  console.log(new Date(), "Detected event.id:", event.id);
  const now = DateTime.now().setZone("Asia/Tokyo");
  const quizType: QuizType = detectionResult;

  if (isAlreadyAnswered(event.id)) {
    console.log(new Date(), `event.id: ${event.id} already answered.`);
    return;
  }
  if (isAlreadyAnsweredToday(now)) {
    console.log(new Date(), `now.toFormat("yyyy-MM-dd"): ${now.toFormat("yyyy-MM-dd")} already answered.`);
    return;
  }

  const replyId = event.id;
  const prediction = predictDau(quizType);
  if (prediction < 0) {
    console.error(new Date(), `Error! prediction: ${prediction}`);
    recordAnsweredId(replyId);
    return;
  }

  console.log(new Date(), "Prediction:", prediction);
  const content = `${prediction}`;
  const created_at = Math.max(Math.floor(Date.now() / 1000), event.created_at + 1);
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
    privKey,
  );
  recordAnsweredId(replyId);
  recordLatestAnsweredDate(now);
  console.log(new Date(), "Before race");
  await Promise.race([
    Promise.allSettled(pool.publish(relays, ev)).then(() => {
      console.log(new Date(), "Done allSettled!");
    }),
    new Promise((resolve) => {
      setTimeout(
        () => {
          console.log(new Date(), "Timeout!");
          resolve(null);
        },
        10 * 60 * 1000,
      );
    }),
  ]);
  console.log(new Date(), "After race");
});
