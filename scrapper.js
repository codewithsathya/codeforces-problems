const { browserClient } = require("./browserClient");
const axios = require("axios");
const fs = require("fs-extra");

let isShuttingDown = false;

async function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function run() {
    const { data: problemSet } = await axios.get("https://codeforces.com/api/problemset.problems");
    const dataFilePath = "./questionsData.json";

    const questionsData = fs.readJSONSync(dataFilePath);
    const problems = problemSet.result.problems;

    await browserClient.initialize();

    let count = 0;

    for (const problem of problems) {
        if (isShuttingDown) break;

        const { contestId, index } = problem;
        const id = `${contestId}:${index}`;
        if (questionsData[id]) {
            console.log(`Skipped ${id}`);
            count++;
            continue;
        }

        const url = `https://codeforces.com/contest/${contestId}/problem/${index}`;
        const html = await browserClient.getData(url);
        questionsData[id] = true;
        fs.writeJSONSync(dataFilePath, questionsData);
        fs.writeFileSync(`./content/${id}.html`, html);

        console.log(`Saved ${id} problem, ${count} problems`);
        count++;
        const sleepTime = Math.random() * 1000 + 500;
        // await sleep(sleepTime);
    }

    await shutdown();
}

async function shutdown() {
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