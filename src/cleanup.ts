import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const contentDir = join(import.meta.dir, "..", "content");

function hasCloudflareIssue(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, "utf-8");
    return content.includes("Just a moment...");
  } catch (error) {
    console.error(`Error reading ${filePath}: ${(error as Error).message}`);
    return false;
  }
}

function findProblematicFiles(): void {
  if (!existsSync(contentDir)) {
    console.error(`Content directory not found: ${contentDir}`);
    return;
  }

  const files = readdirSync(contentDir);
  const problematicFiles: string[] = [];

  for (const file of files) {
    if (file.endsWith(".html")) {
      const filePath = join(contentDir, file);
      if (hasCloudflareIssue(filePath)) {
        problematicFiles.push(file);
      }
    }
  }

  const questionsData: Record<string, boolean> = JSON.parse(
    readFileSync("questionsData.json", "utf-8")
  );

  for (const file of problematicFiles) {
    const questionId = basename(file, ".html");
    if (questionsData[questionId]) {
      questionsData[questionId] = false;
    }
  }

  console.log(`Found ${problematicFiles.length} problematic files.`);
  writeFileSync("questionsData.json", JSON.stringify(questionsData, null, 2));
}

findProblematicFiles();
