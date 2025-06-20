#!/bin/zsh

source /Users/codewithsathya/.zshrc

cd /Users/codewithsathya/Desktop/projects/codeforces-problems

node scrapper.js
git add .
git commit -m "add problems"
git push