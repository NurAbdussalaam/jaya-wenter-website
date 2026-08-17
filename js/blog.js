fetch('/content/blog.json')
  .then(function(res) {
    if (!res.ok) throw new Error('Gagal memuat blog.json');
    return res.json();
  })
  .then(function(data) {
    var grid = document.getElementById('blogGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    data.posts.forEach(function(post, index) {
      var article = document.createElement('article');
      article.className = 'blog-card';
      
      // Buat link yang sesuai
      var link = '';
      if (post.link) {
        // Postingan lama: link ke file HTML terpisah
        link = post.link;
      } else {
        // Postingan baru: link ke post.html dengan parameter
        link = 'post.html?slug=' + encodeURIComponent(post.title);
      }
      
      article.innerHTML = 
        '<img src="' + (post.cover || '/assets/default-blog.jpg') + '" alt="' + post.title + '" class="blog-thumb">' +
        '<div class="blog-card-content">' +
        '<h2>' + post.title + '</h2>' +
        '<p>' + (post.summary || '') + '</p>' +
        '<a href="' + link + '" class="blog-button">Baca Selengkapnya →</a>' +
        '</div>';
      
      grid.appendChild(article);
    });
  })
  .catch(function(err) {
    console.error('Error loading blog:', err);
    var grid = document.getElementById('blogGrid');
    if (grid) {
      grid.innerHTML = '<p style="color:#c00;text-align:center;">Gagal memuat daftar blog.</p>';
    }
  });
