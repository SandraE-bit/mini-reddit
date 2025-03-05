async function fetchAndStore(key, url, property = null) {
  if (!localStorage.getItem(key)) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      if (!data || (property && !data[property])) {
        throw new Error(`Invalid data format for ${key}`);
      }
      const value = property ? data[property] : data;
      localStorage.setItem(key, JSON.stringify(value));
      console.log(`${key} fetched and stored successfully!`);
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
    }
  } else {
    console.log(`${key} already exists in localStorage, skipping fetch.`);
  }
}

async function fetchAndStoreAll() {

  await fetchAndStore("users", "https://dummyjson.com/users", "users");
  await fetchAndStore("posts", "https://dummyjson.com/posts", "posts");
  await fetchAndStore("comments", "https://dummyjson.com/comments", "comments");
}

function getUsers() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  console.log("Users fetched from localStorage:", users);
  return users;
}

function getPosts() {
  const stored = JSON.parse(localStorage.getItem('posts'));
  if (Array.isArray(stored)) return stored;
  else if (stored && stored.posts) return stored.posts;
  return [];
}

function getComments() {
  return JSON.parse(localStorage.getItem('comments')) || [];
}
  
  function savePosts(postsArray) {
    const data = { posts: postsArray };
    localStorage.setItem('posts', JSON.stringify(data));
  }
  
  function saveComments(comments) {
    localStorage.setItem('comments', JSON.stringify(comments));
  }

  function getUserForPost(post) {
    const users = getUsers();
   
    const user = users.find(u => u.id === Number(post.userId));
    console.log("Post userId:", post.userId, "Matching user:", user);
  
    if (!user && users.length > 0) {
      const fallbackIndex = (Number(post.id) - 1) % users.length;
      return users[fallbackIndex];
    }
    return user || { firstName: 'Unknown', lastName: '' };
  }
 
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    console.log("All URL-parameters:", urlParams.toString());
    return urlParams.get(param);
  }

  function generateUniqueId(existingItems) {
    return existingItems.length > 0 ? Math.max(...existingItems.map(item => Number(item.id))) + 1 : 1;
  }

  function buildUserData() {
    try {
      const users = getUsers();
      const posts = getPosts();
      const comments = getComments();
  
      if (users.length === 0) console.warn("Warning: No users found!");
      if (posts.length === 0) console.warn("Warning: No posts found!");
      if (comments.length === 0) console.warn("Warning: No comments found!");
  
      const userData = users.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        posts: posts.filter(post => post.userId === user.id),
        comments: comments.filter(comment => comment.userId === user.id),
      }));
  
      localStorage.setItem("userData", JSON.stringify(userData));
      console.log("User data mapped and stored:", userData);
      
    } catch (error) {
      console.error("Error building user data:", error);
    }
  }
    function displayPosts() {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) {
      console.error("Element with id 'postsContainer' not found.");
      return;
    }
    postsContainer.innerHTML = '';
    
    const posts = getPosts();
    console.log("Posts retrieved:", getPosts());
    posts.forEach(post => {
      const user = getUserForPost(post);
      const snippet = post.body.length > 60 ? post.body.substring(0, 60) + '...' : post.body;
      const postDiv = document.createElement('div');
      postDiv.className = 'post';
      postDiv.innerHTML = `
        <div class="post-title">${post.title}</div>
        <div class="post-body">${snippet}</div>
        <div class="post-tags">Tags: ${post.tags.join(', ')}</div>
        <div class="post-author">Created by: ${user.firstName} ${user.lastName}</div>
      `;
      postDiv.addEventListener('click', function () {
        console.log("Opening post with ID:", post.id);
        window.location.href = 'post.html?postId=' + post.id;
      });
      postsContainer.appendChild(postDiv);
    });
    console.log("All posts displayed on index:", posts);
  }
  
  function handleNewPostForm() {
    const form = document.getElementById('newPostForm');
    if (!form) {
      console.error("Element with id 'newPostForm' not found.");
      return;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      
      const title = document.getElementById('postTitle').value;
      const body = document.getElementById('postBody').value;
      const tagsInput = document.getElementById('postTags').value;
      let userId = parseInt(document.getElementById('postUser').value);
      
      if (isNaN(userId)) {
        alert('Please select a user!');
        return;
      }
      
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      let posts = getPosts();
      let newId = generateUniqueId(posts);
      
      const newPost = {
        id: newId,
        title: title,
        body: body,
        userId: userId,
        tags: tags,
        reactions: { likes: 0, dislikes: 0 }
      };
      
      posts.push(newPost);
      savePosts(posts);
      console.log("New post saved:", newPost);
      displayPosts();
      form.reset();
    });
  }
  
  async function initIndexPage() {
    await fetchAndStoreAll();
    populateUserDropdown();
    displayPosts();
    handleNewPostForm();
  }
  
  async function initPostPage() {
    const posts = getPosts();
    const postId = getQueryParam('postId');
    
    console.log("All posts from localStorage:", posts);
    console.log("Searching for postId:", postId, " (type:", typeof postId, ")");
    console.log("All IDs in the list:", posts.map(p => p.id));
    
    const post = posts.find(p => Number(p.id) === Number(postId));
    console.log("Found post:", post);
    
    if (!post) {
      document.body.innerHTML = '<p>The post was not found.</p>';
      return;
    }
    
    displayPost(post);
    displayComments(postId);
    populateCommentUserDropdown();
    handleNewCommentForm(postId);
  }
  
  function displayPost(post) {
    if (typeof post.reactions !== "object") {
      post.reactions = { likes: 0, dislikes: 0 };
    }
    if (!post.tags) post.tags = [];
    
    const user = getUserForPost(post);
    const postContainer = document.getElementById('postContainer');
    if (!postContainer) {
      console.error("Element with id 'postContainer' not found.");
      return;
    }
    postContainer.innerHTML = `
      <div class="post-title">${post.title}</div>
      <div class="post-body">${post.body}</div>
      <div class="post-tags">Tags: ${post.tags.length > 0 ? post.tags.join(', ') : 'No tags'}</div>
      <div class="post-author">Created by: ${user.firstName} ${user.lastName}</div>
      <div class="reactions">
        <button id="likeBtn">Like&#128077</button>
        <button id="dislikeBtn">Dislike&#128078;</button>
        <div>Reactions: <span id="reactionCount">${post.reactions.likes + post.reactions.dislikes}</span></div>
      </div>
      <h3>Comments</h3>
      <div id="commentsSection"></div>
    `;
    document.getElementById('likeBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      updateReaction(post.id, 'likes');
    });
    document.getElementById('dislikeBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      updateReaction(post.id, 'dislikes');
    });
  }
  
  function updateReaction(postId, type) {
    let posts = getPosts();
    const postIndex = posts.findIndex(p => p.id == postId);
    if (postIndex !== -1) {
      if (!posts[postIndex].reactions || typeof posts[postIndex].reactions !== "object") {
        posts[postIndex].reactions = { likes: 0, dislikes: 0 };
      }
      posts[postIndex].reactions[type] = (posts[postIndex].reactions[type] || 0) + 1;
      savePosts(posts);
      document.getElementById('reactionCount').textContent =
        posts[postIndex].reactions.likes + posts[postIndex].reactions.dislikes;
    }
  }
  
  function displayComments(postId) {
    const commentsSection = document.getElementById('commentsSection');
    if (!commentsSection) {
      console.error("Element with id 'commentsSection' not found.");
      return;
    }
    commentsSection.innerHTML = '';
    
    const comments = getComments().filter(comment => comment.postId == postId);
    const users = getUsers();
    comments.forEach(comment => {
      const user = users.find(u => u.id === Number(comment.userId));
      const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
      const commentDiv = document.createElement('div');
      commentDiv.className = 'comment';
      commentDiv.innerHTML = `
        <div class="comment-body">${comment.body}</div>
        <div class="comment-author">By: ${userName}</div>
      `;
      commentsSection.appendChild(commentDiv);
    });
  }
  
  function populateUserDropdown() {
    const userSelect = document.getElementById('postUser');
    if (!userSelect) {
      console.error("Element with id 'postUser' not found.");
      return;
    }
    const users = getUsers();
    userSelect.innerHTML = '<option value="">Select user</option>';
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.firstName + ' ' + user.lastName;
      userSelect.appendChild(option);
    });
  }
  
  function populateCommentUserDropdown() {
    const commentUserSelect = document.getElementById('commentUser');
    if (!commentUserSelect) {
      console.error('Element with id "commentUser" not found.');
      return;
    }
    const users = getUsers();
    commentUserSelect.innerHTML = '<option value="">Select user</option>';
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.firstName + ' ' + user.lastName;
      commentUserSelect.appendChild(option);
    });
  }
  
  function handleNewCommentForm(postId) {
    const form = document.getElementById('newCommentForm');
    if (!form) {
      console.error("Element with id 'newCommentForm' not found.");
      return;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const commentBody = document.getElementById('commentBody').value;
      const userId = parseInt(document.getElementById('commentUser').value);
      
      if (isNaN(userId)) {
        alert('Select user!');
        return;
      }
      
      let comments = getComments();
      const newId = comments.length > 0 ? Math.max(...comments.map(c => c.id)) + 1 : 1;
      const newComment = {
        id: newId,
        body: commentBody,
        postId: Number(postId),
        userId: userId
      };
      comments.push(newComment);
      saveComments(comments);
      displayComments(postId);
      form.reset();
    });
  }

  async function initIndexPage() {
    await fetchAndStoreAll();
    populateUserDropdown();
    displayPosts();
    handleNewPostForm();
  }
  
  async function initPostPage() {
    const posts = getPosts();
    const postId = getQueryParam('postId');
    
    console.log("All posts from localStorage:", posts);
    console.log("Searching for postId:", postId, " (type:", typeof postId, ")");
    console.log("All IDs in the list:", posts.map(p => p.id));
    
    const post = posts.find(p => Number(p.id) === Number(postId));
    console.log("Found post:", post);
    
    if (!post) {
      document.body.innerHTML = '<p>The post was not found.</p>';
      return;
    }
    
    displayPost(post);
    displayComments(postId);
    populateCommentUserDropdown();
    handleNewCommentForm(postId);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('postsContainer')) {
      initIndexPage();
    } else if (document.getElementById('postContainer')) {
      initPostPage();
    }
  });
  
  