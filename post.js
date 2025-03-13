const postContainer = document.getElementById("post-container");

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function getUserName(userId, users) {
  const user = users.find(u => u.id === userId);
  return user ? `${user.firstName} ${user.lastName}` : "Unknown";
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

  const storedCustom = JSON.parse(localStorage.getItem("customComments")) || [];
  const customForPost = storedCustom.filter(c => c.postId === postId);

  return [...apiComments, ...customForPost];
}

function populateUserDropdown(users) {
  const userSelect = document.getElementById("commentUser");
  users.forEach(user => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${user.firstName} ${user.lastName}`;
    userSelect.appendChild(option);
  });
}

async function displayPost() {
  const postId = parseInt(getQueryParam("id"));
  if (!postId) {
    postContainer.innerHTML = "<p>Post not found</p>";
    return;
  }

  const posts = JSON.parse(localStorage.getItem("posts")) || [];
  const users = JSON.parse(localStorage.getItem("users")) || [];

  const post = posts.find(p => p.id === postId);
  if (!post) {
    postContainer.innerHTML = "<p>Post not found</p>";
    return;
  }

  const comments = await loadComments(postId);

  postContainer.innerHTML = `
    <h2>${post.title}</h2>
    <p>${post.body}</p>
    <p><strong>Tags:</strong> ${post.tags.join(', ')}</p>
    <p><strong>Created by:</strong> ${getUserName(post.userId, users)}</p>

    <div class="reactions" style="display: flex; gap: 40px; margin-bottom: 20px;">
    <div class="reaction-item" style="text-align: center;">
      <button id="likeBtn">Like&#128077;</button>
      <div><span id="like-count">${post.reactions?.likes ?? 0}</span></div>
    </div>
    <div class="reaction-item" style="text-align: center;">
      <button id="dislikeBtn">Dislike&#128078;</button>
      <div><span id="dislike-count">${post.reactions?.dislikes ?? 0}</span></div>
    </div>
  </div>

    <h3>Comments:</h3>
    <div id="commentsContainer">
      ${comments.length ? comments.map(comment => `
        <div class="comment">
          <p>${comment.body}</p>
          <small>- ${comment.user?.fullName || getUserName(comment.userId, users)}</small>
        </div>
      `).join('') : '<p>No comments yet.</p>'}
    </div>
    

  `;

  populateUserDropdown(users);
 
  const commentForm = document.getElementById("commentForm");
  commentForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const commentBody = document.getElementById("commentBody").value.trim();
    const userId = parseInt(document.getElementById("commentUser").value);
    const user = users.find(u => u.id === userId);

    if (!commentBody || !user) return;

    const newComment = {
      id: Date.now(),
      body: commentBody,
      postId: postId,
      userId: userId,
      user: { fullName: `${user.firstName} ${user.lastName}` }
    };

    const allCustomComments = JSON.parse(localStorage.getItem("customComments")) || [];
    allCustomComments.push(newComment);
    localStorage.setItem("customComments", JSON.stringify(allCustomComments));

    const commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");
    commentDiv.innerHTML = `
      <p>${newComment.body}</p>
      <small>- ${newComment.user.fullName}</small>
    `;
    document.getElementById("commentsContainer").appendChild(commentDiv);

    commentForm.reset();
  });

  const likeButton = document.getElementById("likeBtn");
  const dislikeButton = document.getElementById("dislikeBtn");
  
  likeButton.addEventListener("click", function () {
    const likeCount = document.getElementById("like-count");
    const newLikes = parseInt(likeCount.textContent) + 1;
    likeCount.textContent = newLikes;
  
    post.reactions.likes = newLikes;
    localStorage.setItem("posts", JSON.stringify(posts));
  });
  
  dislikeButton.addEventListener("click", function () {
    const dislikeCount = document.getElementById("dislike-count");
    const newDislikes = parseInt(dislikeCount.textContent) + 1;
    dislikeCount.textContent = newDislikes;
  
    post.reactions.dislikes = newDislikes;
    localStorage.setItem("posts", JSON.stringify(posts));
  });
}

document.getElementById("goBackButton").addEventListener("click", function () {
  window.location.href = "index.html"; 
});

document.addEventListener("DOMContentLoaded", displayPost);

 
  

