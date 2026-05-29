window.blogPosts = window.blogPosts || [];

const blogPostFiles = [
  "./posts/how-to-build-a-film-press-kit-that-actually-helps-your-project-move.js"
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