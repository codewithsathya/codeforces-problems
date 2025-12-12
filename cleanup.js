const fs = require('fs');
const path = require('path');

// Directory containing HTML files
const contentDir = path.join(__dirname, 'content');

// Function to check if file has Cloudflare challenge page
function hasCloudflareIssue(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for Cloudflare indicators
        return content.includes('Just a moment...')
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
        return false;
    }
}

// Function to scan all HTML files
function findProblematicFiles() {
    if (!fs.existsSync(contentDir)) {
        console.error(`Content directory not found: ${contentDir}`);
        return;
    }

    const files = fs.readdirSync(contentDir);
    const problematicFiles = [];

    files.forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(contentDir, file);
            if (hasCloudflareIssue(filePath)) {
                problematicFiles.push(file);
            }
        }
    });

    const questionsDataStr = fs.readFileSync('questionsData.json', 'utf-8');
    const questionsData = JSON.parse(questionsDataStr);
    
    problematicFiles.forEach(file => {
        const questionId = path.basename(file, '.html');
        if (questionsData[questionId]) {
            questionsData[questionId] = false;
        }
    });
    console.log(`Found ${problematicFiles.length} problematic files.`);
    fs.writeFileSync('questionsData.json', JSON.stringify(questionsData));
}

// Run the scan
findProblematicFiles();
