const postsContainer = document.getElementById("posts-container");

async function loadData() {
  let posts = JSON.parse(localStorage.getItem("posts"));
  let users = JSON.parse(localStorage.getItem("users"));
  
  if (!posts || !users) {
    const [postsRes, usersRes] = await Promise.all([
      fetch("https://dummyjson.com/posts?limit=30"),
      fetch("https://dummyjson.com/users?limit=100")
    ]);
    const postsData = await postsRes.json();
    const usersData = await usersRes.json();
    
    posts = postsData.posts;
    users = usersData.users;
    
    localStorage.setItem("posts", JSON.stringify(posts));
    localStorage.setItem("users", JSON.stringify(users));
  }
  return { posts, users };
}

function getUserName(userId, users) {
  const user = users.find(u => u.id === userId);
  return user ? `${user.firstName} ${user.lastName}` : "Unknown";
}

function truncate(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

async function populateUserDropdown(users) {
  const userSelect = document.getElementById("postUser");
  users.forEach(user => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${user.firstName} ${user.lastName}`;
    userSelect.appendChild(option);
  });
}

async function loadComments(postId) {
  const storedApi = localStorage.getItem(`comments_post_${postId}`);
  let apiComments = [];
  if (storedApi) {
    apiComments = JSON.parse(storedApi);
  } else {
    const response = await fetch(`https://dummyjson.com/posts/${postId}/comments`);
    const data = await response.json();
    apiComments = data.comments;
    localStorage.setItem(`comments_post_${postId}`, JSON.stringify(apiComments));
  }
  return apiComments;
}

async function preloadCommentsForPosts(posts) {
  await Promise.all(posts.map(post => loadComments(post.id)));
}

async function displayPostPreviews() {
  const { posts, users } = await loadData();
 
  await preloadCommentsForPosts(posts);
  
  postsContainer.innerHTML = "";
  posts.forEach(post => {
    const postElement = document.createElement("div");
    postElement.classList.add("post-preview");

    const postLink = document.createElement("a");
    postLink.href = `post.html?id=${post.id}`;
    postLink.classList.add("post-link");

    postLink.innerHTML = `
      <h2>${post.title}</h2>
      <p>${truncate(post.body, 60)}</p>
      <p><strong>Tags:</strong> ${post.tags.join(', ')}</p>
      <p><strong>Created by:</strong> ${getUserName(post.userId, users)}</p>
    `;
    
    postElement.appendChild(postLink);
    postsContainer.appendChild(postElement);
  });
}

async function handleCreatePost(e) {
  e.preventDefault();

  const title = document.getElementById("postTitle").value.trim();
  const body = document.getElementById("postBody").value.trim();
  const tags = document.getElementById("postTags").value.split(',').map(tag => tag.trim());
  const userId = parseInt(document.getElementById("postUser").value);

  if (!title || !body || tags.length === 0 || !userId) {
    return alert("Fill in all fields.");
  }

  const { posts } = await loadData();
  const newPost = {
    id: posts.length > 0 ? posts[posts.length - 1].id + 1 : 1000,
    title,
    body,
    tags,
    userId,
    reactions: {
      likes: 0,
      dislikes: 0
    },
    views: 0
  };

  posts.push(newPost);
  localStorage.setItem("posts", JSON.stringify(posts));

  displayPostPreviews();
  document.getElementById("createPostForm").reset();
}

document.addEventListener("DOMContentLoaded", async () => {
  const { users } = await loadData();
  await populateUserDropdown(users);
  displayPostPreviews();

  const form = document.getElementById("createPostForm");
  form.addEventListener("submit", handleCreatePost);
});
