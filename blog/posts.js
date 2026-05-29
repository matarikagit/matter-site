window.blogPosts = window.blogPosts || [];

const blogPostFiles = [
  "./posts/how-to-build-a-film-press-kit-that-actually-helps-your-project-move.js",
  "./posts/how-to-market-your-film-before-release.js",
  "./posts/why-most-indie-films-never-get-seen-even-after-release.js",
  "./posts/what-distributors-look-for-before-acquiring-an-indie-film.js",
  "./posts/sales-agent-vs-distributor-vs-aggregator-who-actually-does-what.js",
  "./posts/finished-is-not-the-goal-ready-is.js",
  "./posts/why-metadata-matters-for-indie-film-distribution.js",
  "./posts/distribution-deal-red-flags-filmmakers-should-watch-for.js",
  "./posts/how-to-get-your-film-on-tubi.js",
  "./posts/how-to-get-your-film-on-netflix.js"
];

window.blogPostsReady = Promise.all(
  blogPostFiles.map((file) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = file;
      script.onload = resolve;
      script.onerror = () => {
        console.error(`Could not load blog post file: ${file}`);
        reject(new Error(`Could not load blog post file: ${file}`));
      };
      document.head.appendChild(script);
    });
  })
);