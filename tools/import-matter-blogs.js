const fs = require("fs");

const oldPosts = [
  {
    url: "https://matterdistribution.com/2026/03/25/how-to-build-a-film-press-kit-that-actually-helps-your-project-move/",
    category: "marketing",
    featured: true
  },
  {
    url: "https://matterdistribution.com/2026/03/25/sales-agent-vs-distributor-vs-aggregator-who-actually-does-what/",
    category: "distribution",
    featured: false
  },
  {
    url: "https://matterdistribution.com/2026/03/25/what-distributors-look-for-before-acquiring-an-indie-film/",
    category: "distribution",
    featured: false
  },
  {
    url: "https://matterdistribution.com/2026/03/24/why-most-indie-films-never-get-seen-even-after-release/",
    category: "marketing",
    featured: false
  },
  {
    url: "https://matterdistribution.com/2026/03/24/how-to-market-your-film-before-release/",
    category: "marketing",
    featured: false
  },
  {
    url: "https://matterdistribution.com/2026/03/24/how-to-get-your-film-on-streaming-platforms/",
    category: "distribution",
    featured: false
  },
  {
    url: "https://matterdistribution.com/2026/03/23/film-festival-vs-distribution-deal-which-one-actually-moves-your-film-forward/",
    category: "distribution",
    featured: false
  },
  {
    url: "https://matterdistribution.com/2026/03/23/how-to-distribute-an-indie-film-without-a-distributor/",
    category: "distribution",
    featured: false
  },
  {
    url: "https://matterdistribution.com/2026/03/23/why-most-films-fail-before-theyre-even-released-and-how-to-fix-it/",
    category: "marketing",
    featured: false
  }
];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8212;/g, "—")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function makeSlug(url) {
  return url
    .replace("https://matterdistribution.com/", "")
    .split("/")
    .filter(Boolean)
    .pop();
}

function getTitle(html) {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) return stripHtml(h1Match[1]);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    return stripHtml(titleMatch[1]).replace(" - MATTER", "").trim();
  }

  return "Untitled Blog";
}

function getDate(html) {
  const dateMatch = html.match(/([A-Z][a-z]+ \d{1,2}, \d{4})/);
  return dateMatch ? dateMatch[1] : "";
}

function getThumbnail(html) {
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImage) return ogImage[1];

  const imageMatch = html.match(/https:\/\/i0\.wp\.com\/matterdistribution\.com\/wp-content\/uploads\/[^"'\s<>]+/i);
  if (imageMatch) return imageMatch[0].replace(/&amp;/g, "&");

  return "";
}

function extractArticleText(html) {
  let body = html;

  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  if (articleMatch) body = articleMatch[0];

  body = body
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<h1[\s\S]*?<\/h1>/i, "")
    .replace(/Share this:[\s\S]*$/i, "")
    .replace(/Like this:[\s\S]*$/i, "")
    .replace(/Comments[\s\S]*$/i, "")
    .replace(/Discover more from MATTER[\s\S]*$/i, "");

  const blocks = [];

  const blockRegex = /<(h2|h3|p|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = blockRegex.exec(body)) !== null) {
    const tag = match[1].toLowerCase();
    const text = stripHtml(match[2]);

    if (!text) continue;
    if (text === "Share this:" || text === "Like this:" || text === "Comments") continue;
    if (text.includes("Subscribe now to keep reading")) continue;
    if (text.includes("Continue reading")) continue;

    if (tag === "h2" || tag === "h3") {
      blocks.push({ type: "heading", text });
    } else if (tag === "blockquote") {
      blocks.push({ type: "quote", text });
    } else {
      blocks.push({ type: "paragraph", text });
    }
  }

  if (blocks.length) return blocks;

  const fallbackText = stripHtml(body);
  return fallbackText
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .filter((text) => text.length > 60)
    .map((text) => ({ type: "paragraph", text }));
}

function makeBlurb(blocks) {
  const firstParagraph = blocks.find((block) => block.type === "paragraph");
  if (!firstParagraph) return "";

  const text = firstParagraph.text;
  return text.length > 170 ? `${text.slice(0, 167).trim()}...` : text;
}

function makeReadTime(blocks) {
  const words = blocks
    .map((block) => block.text || "")
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
}

async function importPosts() {
  const importedPosts = [];

  for (const oldPost of oldPosts) {
    console.log(`Fetching: ${oldPost.url}`);

    const response = await fetch(oldPost.url, {
      headers: {
        "User-Agent": "MatterBlogImporter/1.0"
      }
    });

    if (!response.ok) {
      console.warn(`Skipped ${oldPost.url}: ${response.status}`);
      continue;
    }

    const html = await response.text();
    const title = getTitle(html);
    const date = getDate(html);
    const thumbnail = getThumbnail(html);
    const content = extractArticleText(html);

    importedPosts.push({
      slug: makeSlug(oldPost.url),
      title,
      category: oldPost.category,
      date,
      author: "Charles Cooper",
      readTime: makeReadTime(content),
      featured: oldPost.featured,
      thumbnail,
      blurb: makeBlurb(content),
      content
    });
  }

  const output = `const blogPosts = ${JSON.stringify(importedPosts, null, 2)};\n`;

  fs.writeFileSync("./blog/posts.js", output, "utf8");

  console.log(`Done. Imported ${importedPosts.length} posts into blog/posts.js`);
}

importPosts().catch((error) => {
  console.error(error);
  process.exit(1);
});