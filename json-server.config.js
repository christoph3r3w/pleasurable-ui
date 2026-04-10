// Mock API server using json-server
// This file creates routes that match the WordPress REST API structure

export default (app, server) => {
  const jsonServer = server.jsonServer;
  const db = server.db;

  // WordPress-style routes
  // GET /wp-json/wp/v2/posts -> returns all posts
  app.get('/wp-json/wp/v2/posts', (req, res) => {
    const posts = db.data.posts || [];
    res.json(posts);
  });

  // GET /wp-json/wp/v2/posts/:id -> returns single post
  app.get('/wp-json/wp/v2/posts/:id', (req, res) => {
    const post = db.data.posts.find(p => p.id === parseInt(req.params.id));
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ code: 'rest_post_invalid_id', message: 'Invalid post ID.' });
    }
  });

  // GET /wp-json/wp/v2/users -> returns all authors
  app.get('/wp-json/wp/v2/users', (req, res) => {
    const users = db.data.authors || [];
    res.json(users);
  });

  // GET /wp-json/wp/v2/users/:id -> returns single author
  app.get('/wp-json/wp/v2/users/:id', (req, res) => {
    const user = db.data.authors.find(a => a.id === parseInt(req.params.id));
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ code: 'rest_user_invalid_id', message: 'Invalid user ID.' });
    }
  });

  // GET /wp-json/wp/v2/categories -> returns all categories
  app.get('/wp-json/wp/v2/categories', (req, res) => {
    const categories = db.data.categories || [];
    res.json(categories);
  });

  // GET /wp-json/wp/v2/categories/:id -> returns single category
  app.get('/wp-json/wp/v2/categories/:id', (req, res) => {
    const category = db.data.categories.find(c => c.id === parseInt(req.params.id));
    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ code: 'rest_no_route', message: 'No route was found matching the URL and request method.' });
    }
  });
};
