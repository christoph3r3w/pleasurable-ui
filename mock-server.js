import express from 'express';
import { readFile } from 'fs/promises';
import fetchJson from './helpers/fetch-json.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.set("views", "./views");
app.use(express.static("./public/"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.locals.pageViews = {};

const data = JSON.parse(await readFile('Api.json', 'utf-8'));

const apiUrl = `http://localhost:${PORT}/wp-json/wp/v2`;
const directus_apiUrl = "https://fdnd-agency.directus.app/items/redpers_shares";

const postsUrl = `${apiUrl}/posts?per_page=100&orderby=date&order=desc`;
const usersUrl = `${apiUrl}/users`;
const categoryUrl = `${apiUrl}/posts?per_page=100&orderby=date&order=desc&categories=1,4,6,9,63,94,1010,3211,7164&_fields=id,categories,slug,date_gmt,excerpt,status,author,yoast_head_json`;
const categoriesUrl = `${apiUrl}/categories?per_page=100`;

const categories = [
    { slug: "binnenland", id: 9, name: "Binnenland", posts: [] },
    { slug: "buitenland", id: 1010, name: "Buitenland", posts: [] },
    { slug: "column", id: 7164, name: "column", posts: [] },
    { slug: "economie", id: 6, name: "economie", posts: [] },
    { slug: "kunst-media", id: 4, name: "Kunst-media", posts: [] },
    { slug: "podcast", id: 3211, name: "Podcast", posts: [] },
    { slug: "politiek", id: 63, name: "Politiek", posts: [] },
    { slug: "wetenschap", id: 94, name: "Wetenschap", posts: [] },
];

const cats = {
    binnenland: 9,
    buitenland: 1010,
 column: 7164,
    economie: 6,
    'kunst-media': 4,
    podcast: 3211,
    politiek: 63,
    wetenschap: 94
};

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

function metaParse(p) {
    if (!Array.isArray(p)) return [];
    p.forEach(postData => {
        try {
            const postDate = new Date(postData.date_gmt);
            const dateOptions = { day: 'numeric', month: 'long' };
            const formattedDate = postDate.toLocaleDateString('nl-NL', dateOptions);
            const author = postData.yoast_head_json?.twitter_misc?.['Geschreven door'] ?? 'N/A';
            let readingTime = postData.yoast_head_json?.twitter_misc?.['Geschatte leestijd'] ?? 'N/A';
            if (typeof readingTime === 'string') readingTime = readingTime.replace('minuten', 'min');
            postData.date_gmt = formattedDate;
            postData.readingTime = readingTime;
            postData.meta = `${formattedDate} - ${author} - ${readingTime}`;
        } catch (error) {}
    });
    return p;
}

function dateParse(postData) {
    if (!postData) return postData;
    try {
        const postDate = new Date(postData.date_gmt);
        const dateOptions = { day: 'numeric', month: 'long' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        const formattedDate = postDate.toLocaleDateString('nl-NL', dateOptions);
        const formattedTime = postDate.toLocaleTimeString('nl-NL', timeOptions);
        postData.date_gmt = `${formattedDate} ${formattedTime}`;
    } catch(e) {}
    return postData;
}

const views = function(postID){
    if (!app.locals.pageViews[postID]) {
        app.locals.pageViews[postID] = 1;
    } else {
        app.locals.pageViews[postID]++;
    }
    return app.locals.pageViews[postID];
};

// MOCK API ROUTES
app.get('/wp-json/wp/v2/posts', (req, res) => {
    let posts = data.posts || [];
    if (req.query.categories) {
        const catArray = req.query.categories.split(',').map(Number);
        posts = posts.filter(p => p.categories && p.categories.some(c => catArray.includes(c)));
    }
    if (req.query.author) {
        posts = posts.filter(p => p.author === parseInt(req.query.author));
    }
    res.json(posts);
});

app.get('/wp-json/wp/v2/posts/:id', (req, res) => {
    const post = data.posts?.find(p => p.id === parseInt(req.params.id));
    post ? res.json(post) : res.status(404).json({ code: 'rest_post_invalid_id', message: 'Invalid post ID.', data: { status: 404 }});
});

app.get('/wp-json/wp/v2/users', (req, res) => res.json(data.authors || []));

app.get('/wp-json/wp/v2/users/:id', (req, res) => {
    const user = data.authors?.find(a => a.id === parseInt(req.params.id));
    user ? res.json(user) : res.status(404).json({ code: 'rest_user_invalid_id', data: { status: 404 }});
});

app.get('/wp-json/wp/v2/categories', (req, res) => res.json(data.categories || []));

app.get('/wp-json/wp/v2/categories/:id', (req, res) => {
    const category = data.categories?.find(c => c.id === parseInt(req.params.id));
    category ? res.json(category) : res.status(404).json({ code: 'rest_no_route', data: { status: 404 }});
});

// FRONTEND ROUTES
app.get("/", (req, res) => {
    Promise.all([fetchJson(postsUrl), fetchJson(usersUrl), fetchJson(categoryUrl)]).then(([postData, userData, categoryData]) => {
        res.render("index.ejs", {
            posts: Array.isArray(postData) ? metaParse(postData) : [],
            user: Array.isArray(userData) ? userData : [],
            categories
        });
    }).catch(err => {
        res.render("index.ejs", { posts: [], user: [], categories, error: "Unable to load content." });
    });
});

app.get("/detail/:id", (req, res) => {
    let postID = req.params.id;
    console.log(`🖥️ GET /detail/${postID} (Rendering detail page)`);
    Promise.all([
        fetchJson(`${apiUrl}/posts/${postID}`),
        fetchJson(categoriesUrl),
        fetchJson(`${directus_apiUrl}?filter[id][_eq]=${postID}`)
    ]).then(([postData, categoryData, directusData]) => {
        if (!postData || postData.data?.status === 404 || postData.code === 'rest_post_invalid_id') return res.status(404).send("Post not found");
        res.render("detail.ejs", {
            post: dateParse(postData),
            categories: Array.isArray(categoryData) ? categoryData : [],
            direct: directusData?.data?.length ? directusData.data[0] : false,
        });
    }).catch(error => res.status(500).send("Error loading post."));
});

app.post("/detail/:id/likes", (req, res) => {
    fetchJson(`${directus_apiUrl}/?filter[id][_eq]=${req.params.id}`).then(({data}) => {
        if (!data || !data.length) return res.status(404).json({ error: "Not found" });
        const newLikes = data[0].likes >= 1 ? 0 : 1;
        const payload = { headers: {"content-type":"application/json"} };
        if (req.body.action === 'like' && newLikes === 1) {
            payload.method = 'POST'; payload.body = JSON.stringify({ id: req.params.id, likes: newLikes });
        } else if (req.body.action === 'like' && newLikes === 0) payload.method = 'DELETE';
        
        fetchJson(`${directus_apiUrl}/${data[0].id || ''}`, payload).then(result => {
            if (req.body.enhanced) res.render('./partials/likes.ejs', { post: {id: req.params.id}, likes: {newLikes} });
            else res.redirect(303, `/detail/${req.params.id}`);
        }).catch(() => res.status(500).send("Error"));
    });
});

app.post("/detail/:id/shares", (req, res) => {
    fetchJson(`${directus_apiUrl}/?filter[id][_eq]=${req.params.id}`).then(({data}) => {
        if (!data || !data.length) return res.status(404).json({ error: "Not found" });
        const newShares = data[0].shares >= 1 ? 0 : 1;
        const payload = { headers: {"content-type":"application/json"} };
        if (req.body.action === 'share' && newShares === 1) {
            payload.method = 'POST'; payload.body = JSON.stringify({ id: req.params.id, shares: newShares });
            fetchJson(`${directus_apiUrl}/${data[0].id || ''}`, payload).then(result => {
                if (req.body.enhanced) res.render('./partials/shares.ejs', { post: {id: req.params.id}, shares: {newShares} });
                else res.redirect(303, `/detail/${req.params.id}`);
            }).catch(() => res.status(500).send("Error"));
        } else if (req.body.action === 'share' && newShares === 0) {
            if (req.body.enhanced) res.render('./partials/shares.ejs', { post: {id: req.params.id}, shares: {newShares} });
            else res.redirect(303, `/detail/${req.params.id}`);
        }
    });
});

app.get('/category/:name', (req, res) => {
    let categoryName = req.params.name;
    let categoryID = cats[categoryName];
    if (!categoryID) return res.status(404).send("Category not found");
    Promise.all([
        fetchJson(`${postsUrl}&categories=${categoryID}`),
        fetchJson(`${apiUrl}/categories/${categoryID}`)
    ]).then(([postData, categoryData]) => {
        res.render("category.ejs", {
            posts: Array.isArray(postData) ? metaParse(postData) : [],
            category: categoryData || { name: categoryName, id: categoryID },
        });
    }).catch(() => res.render("category.ejs", { posts: [], category: { name: categoryName, id: categoryID }, error: "Error" }));
});

app.get("/authors", (req, res) => {
    Promise.all([fetchJson(usersUrl)]).then(([userData]) => {
        res.render("authors.ejs", { authors: Array.isArray(userData) ? userData : [] });
    }).catch(() => res.render("authors.ejs", { authors: [], error: "Error" }));
});

app.get("/author/:id", (req, res) => {
    let authorID = req.params.id;
    Promise.all([
        fetchJson(`${postsUrl}&author=${authorID}`),
        fetchJson(`${usersUrl}/${authorID}`),
    ]).then(([postData, userData]) => {
        if (!userData || userData.data?.status === 404) return res.status(404).send("Author not found");
        res.render("author.ejs", {
            posts: Array.isArray(postData) ? metaParse(postData) : [],
            user: userData,
        });
    }).catch(() => res.status(500).send("Error"));
});

app.listen(PORT, () => {
    console.log('\n🚀 Mock Server Started with FRONTEND Routes Included!\n');
    console.log(`   Running on: http://localhost:${PORT}\n`);
    console.log('📡 Mock API Data Endpoint Base:');
    console.log(`   GET http://localhost:${PORT}/wp-json/wp/v2/...\n`);
    console.log('💻 Frontend Routes:');
    console.log(`   - Home:         http://localhost:${PORT}/`);
    console.log(`   - Detail:       http://localhost:${PORT}/detail/:id`);
    console.log(`   - Authors:      http://localhost:${PORT}/authors`);
    console.log(`   - Categories:   http://localhost:${PORT}/category/:name`);
});