import { readFileSync, writeFileSync } from "node:fs";
import { browserClient } from "./browserClient";

let isShuttingDown = false;

interface Problem {
  contestId: number;
  index: string;
}

interface ProblemSetResponse {
  result: {
    problems: Problem[];
  };
}

async function run(): Promise<void> {
  const response = await fetch("https://codeforces.com/api/problemset.problems");
  const problemSet: ProblemSetResponse = await response.json();
  const dataFilePath = "./questionsData.json";

  const questionsData: Record<string, boolean> = JSON.parse(
    readFileSync(dataFilePath, "utf-8")
  );
  const problems = problemSet.result.problems;

  await browserClient.initialize();

  let count = 0;

  const ignoreContests = new Set([2052, 1912, 1666, 1510, 1267, 1089]);

  for (const problem of problems) {
    if (isShuttingDown) break;

    const { contestId, index } = problem;
    // if(!ignoreContests.has(contestId)) continue;
    const id = `${contestId}:${index}`;
    if (questionsData[id]) {
      console.log(`Skipped ${id}`);
      count++;
      continue;
    }

    const url = `https://codeforces.com/contest/${contestId}/problem/${index}`;

    try {
      const html = await browserClient.getData(url);
      questionsData[id] = true;
      writeFileSync(dataFilePath, JSON.stringify(questionsData, null, 2));
      writeFileSync(`./content/${id}.html`, html);

      console.log(`Saved ${id} problem, ${count} problems`);
      count++;
      const sleepTime = Math.random() * 1000 + 500;
      // await Bun.sleep(sleepTime);
    } catch (error) {
      questionsData[id] = true;
      writeFileSync(dataFilePath, JSON.stringify(questionsData, null, 2));
      continue;
    }
  }

  await shutdown();
}

async function shutdown(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");
  browserClient.close();
  process.exit();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

run().catch(async (err) => {
  console.error("Error occurred:", err);
  await shutdown();
});
