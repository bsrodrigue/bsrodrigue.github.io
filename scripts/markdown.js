async function loadPosts() {
  const posts = [
    { title: "Dreamserver", file: "posts/dreamserver.md" },
  ];

  const nav = document.getElementById("post-list");
  const content = document.getElementById("content");

  posts.forEach(post => {
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = post.title;
    link.onclick = async () => {
      const resp = await fetch(post.file);
      const md = await resp.text();
      content.innerHTML = marked.parse(md);
    };
    nav.appendChild(link);
  });
}

window.onload = loadPosts;

