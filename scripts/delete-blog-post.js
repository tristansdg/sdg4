#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { listingPageHTML } = require('./build-blog-post.js');

const ROOT = path.resolve(__dirname, '..');
const ISSUE_NUM = parseInt(process.env.ISSUE_NUMBER, 10);

function main() {
  const manifestPath = path.join(ROOT, 'blog', 'posts.json');

  let posts = [];
  try {
    posts = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    console.log('No posts manifest found. Nothing to delete.');
    return;
  }

  const post = posts.find((p) => p.issueNumber === ISSUE_NUM);
  if (!post) {
    console.log(`No post found for issue #${ISSUE_NUM}. Nothing to delete.`);
    return;
  }

  const postPath = path.join(ROOT, 'blog', 'posts', `${post.slug}.html`);
  if (fs.existsSync(postPath)) {
    fs.unlinkSync(postPath);
    console.log(`Deleted file: blog/posts/${post.slug}.html`);
  }

  posts = posts.filter((p) => p.issueNumber !== ISSUE_NUM);
  fs.writeFileSync(manifestPath, JSON.stringify(posts, null, 2));

  fs.writeFileSync(path.join(ROOT, 'blog.html'), listingPageHTML(posts));

  console.log(`Removed blog post: "${post.title}" (issue #${ISSUE_NUM})`);
}

main();
