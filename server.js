import express from "express";

const app = express();

import fetchJson from "./helpers/fetch-json.js";
import { promises } from "dns";

// main HTML files and the public files
app.set("views", "./views");
app.use(express.static("./public/"));

// ejs
app.set("view engine", "ejs");

// dont know what this does
app.use(express.urlencoded({ extended: true }));

//!!!!!!!!!! External router concept !!!!!!!!!!!!!

// const authorRouter = require("./server-routes/author");
// const userRouter = require("./server-routes/user");
// const postRouter = require("./server-routes/post");
// const categoriesRouter = require("./server-routes/categories");

// app.use("/author", authorRouter);
// app.use("/user", userRouter);
// app.use("/post", postRouter);
// app.use("/categories", categoriesRouter);




// Redpers database //

// main Url
const apiUrl = "https://redpers.nl/wp-json/wp/v2";

//directus url
const directus_apiUrl = "https://fdnd-agency.directus.app/items/redpers_shares";
// const directus_filterUrl = `${directus_apiUrl}?filter[id][_eq]=${request.params.id}`;

//End points //

//post
const postsUrl = `${apiUrl}/posts?per_page=100&orderby=date&order=desc`;
//users
const usersUrl = `${apiUrl}/users`;
//categories
const categoryUrl = `${apiUrl}/posts?per_page=100&orderby=date&order=desc&categories=1,4,6,9,63,94,1010,3211,7164&_fields=id,categories,slug,date_gmt,excerpt,status,author,yoast_head_json`;
const categoriesUrl = `${apiUrl}/categories?per_page=100`

// functions//

// metaParse
function metaParse(postsData) {
    postsData.forEach(postData => {
        const postDate = new Date(postData.date_gmt);
        
        const dateOptions = { day: 'numeric', month: 'long' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        
        const formattedDate = postDate.toLocaleDateString('nl-NL', dateOptions);
        const formattedTime = postDate.toLocaleTimeString('nl-NL', timeOptions);

		const author = postData.yoast_head_json?.twitter_misc?.["Geschreven door"] ?? "N/A";

		const readingTime = postData.yoast_head_json?.twitter_misc?.["Geschatte leestijd"] ?? "N/A";
		const estimatedReadingTime = readingTime.replace("minuten", "min");

		postData.date_gmt = `${formattedDate} ${formattedTime}`; // Added this for home page

		postData.readingTime = `${estimatedReadingTime}`		
        
		postData.meta = `${formattedDate} ${formattedTime} - ${author} - ${estimatedReadingTime}`;
    });

    return postsData;
}

// dateParse
function dateParse(postData) {
    const postDate = new Date(postData.date_gmt);
    
    const dateOptions = { day: 'numeric', month: 'long' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    const formattedDate = postDate.toLocaleDateString('nl-NL', dateOptions);
    const formattedTime = postDate.toLocaleTimeString('nl-NL', timeOptions);
    
    postData.date_gmt = `${formattedDate} ${formattedTime}`;

    return postData;
}

// page views 

const views = function(postID){
	if (!app.locals.pageViews[postID]) {
		app.locals.pageViews[postID] = 1;
	} else {
		app.locals.pageViews[postID]++;
	}
}

// categories local storage 
const categories = [

	{
		slug: "binnenland",
		id: 9,
		name: "Binnenland",
		posts: [],
	},
	{
		slug: "buitenland",
		id: 1010,
		name: "Buitenland",
		posts: [],
	},
	{
		slug: "column",
		id: 7164,
		name: "column",
		posts: [],
	},
	{
		slug: "economie",
		id: 6,
		name: "economie",
		posts: [],
	},
	{
		slug: "kunst-media",
		id: 4,
		name: "Kunst-media",
		posts: [],
	},
	{
		slug: "podcast",
		id: 3211,
		name: "Podcast",
		posts: [],
	},
	{
		slug: "politiek",
		id: 63,
		name: "Politiek",
		posts: [],
	},
	{
		slug: "wetenschap",
		id: 94,
		name: "Wetenschap",
		posts: [],
	},
]

const cats = {
	binnenland: 9,
	buitenland: 1010,
	column: 7164,
	economie: 6,
	'kunst-media': 4,
	podcast: 3211,
	politiek: 63,
	wetenschap: 94
}

// GET route for index
app.get("/",function(req,res){
	Promise.all([
		fetchJson(postsUrl),
		fetchJson(usersUrl),
		fetchJson(categoryUrl)
	])
	.then(([postData,userData,categoryData]) => {

		// all the other functions
		// postData = datePars(postData); 
		// categoryData = datePars(categoryData);
		// console.log("postData");

		postData = metaParse(postData);

		res.render("index.ejs", {
			posts  : postData,
			user : userData,
			categories,
		});
		
			console.log("home success");

	})
	// .catch(err => console.log(err,res.status(500).send("Error fetching data")));
});

// GET route for post
app.get("/detail/:id",function(req,res){

	let postID = req.params.id;

	Promise.all([
		fetchJson(`${apiUrl}/posts/${postID}`),
		fetchJson(categoriesUrl),
		fetchJson(`${directus_apiUrl}?filter[id][_eq]=${postID}`),
	])
		.then(([postData, categoryData, directusData]) => {
			
			// console.log(`Fetching data for post ID: ${postID}`);
			// console.log('Fetched post data:', postData);
			// console.log('Fetched category data:', categoryData);
			// console.log('Fetched Directus data:', directusData);

			// functions //
			//date parser
			//  postData = datePars(postData); 
			// formatPostMeta(postData);
			// console.log(formatPostMeta);

			postData = dateParse(postData)
			
			// page views detection // can be used to show if a page has already been visited
			// views(postData);

			res.render("detail.ejs", {
				post: postData,
				categories: categoryData,
				direct: directusData.data.length ? directusData.data[0] : false,

			});
			// response.render("header.ejs",{post: postData})

			console.log("detail-page succes");
		})
		.catch((error) => {
			// Handle error if fetching data fails
			console.error("Error fetching data:", error);
			res.status(404).send("Post not found");
		});

});

// POST route for post
// likes
app.post("/detail/:id/likes",function(req,res){
	fetchJson(`${directus_apiUrl}/?filter[id][_eq]=${req.params.id}`).then(({data})=>{
		
		// let newLikes = data.length == 0? 1 : data[0].likes >= 1? 0 : data[0].likes + 1;

		const x = data[0];
        const newLikes = (x.likes >= 1) ? 0 : 1;
		const payload = {
			headers: {"content-type":"application/json"}
		}
		if( req.body.action == 'like' && newLikes === 1){
			payload.method = 'POST'
			payload.body = JSON.stringify({
				id: request.params.id,
				likes: newLikes,
			})
		} else if(req.body.action === 'like' && newLikes === 0) {
			payload.method = 'DELETE'
		}

		fetchJson(`${directus_apiUrl}/${data[0].id? data[0].id : ''}`, payload).then((result)=>{
			console.log(result);

			if(req.body.enhanced){
				res.render('./partials/likes.ejs',{
					post :{id: req.params.id},
					likes: { newLikes},

				})
			} else{
				res.redirect(303, `/detail/${req.params.id}`);
			}
		})
		
	})
});

// shares
app.post("/detail/:id/shares",function(req,res){
	fetchJson(`${directus_apiUrl}/?filter[id][_eq]=${req.params.id}`).then(({data})=>{
		
		// need to be changed to a function that copies the url //
		// let newShares = data.length > 0 ? data[0].shares + 1 : 1;

		console.log(data);

		const x = data[0];
        const newLikes = (x.likes >= 1) ? 0 : 1;
		const payload = {
			headers: {"content-type":"application/json"}
		}
		if( req.body.action == 'share' && newShares === 1){
			payload.method = 'POST'
			payload.body = JSON.stringify({
				id: request.params.id,
				likes: newLikes,
			})
		 

			fetchJson(`${directus_apiUrl}/${data[0].id? data[0].id : ''}`, payload).then((result)=>{
				console.log(result);

				if(req.body.enhanced){
					res.render('./partials/likes.ejs',{
						post :{id: req.params.id},
						likes: { newLikes},

					})
				} else{
					res.redirect(303, `/detail/${req.params.id}`);
				}
			})
		}
	})
});

// GET route for individual category 
app.get("/category/:name",function(req,res){

	let categoryName = req.params.name;
	let categoryID = cats[categoryName];

	Promise.all([
		fetchJson(`${postsUrl}&categories=${categoryID}`),
		fetchJson(`${apiUrl}/categories/${categoryID}`),
	])
		.then(([postData, categoryData]) => {
			
			res.render("category.ejs", {
				posts: postData,
				category: categoryData,

			});

			console.log(`category:${categoryID}`+"page success");
		})
		.catch((error) => {
			// Handle error if fetching data fails
			console.error("Error fetching data:", error);
			res.status(404).send("Post not found");
		});

});


// GET route for author list
app.get("/authors",function(req,res){
	Promise.all([
		fetchJson(usersUrl)
	]).then(([userData])=>{
		res.render("authors.ejs",{
			authors: userData
		})
	})
	
	console.log("author-page success");

});

// GET route for individual author 
app.get("/author/:id",function(req,res){

	let authorID = req.params.id;

	Promise.all([
		fetchJson(`${postsUrl}&author=${authorID}`),
		fetchJson(`${usersUrl}/${authorID}`),
	])
		.then(([postData, userData]) => {
			
			res.render("author.ejs", {
				posts: postData,
				user: userData,

			});

			console.log(`author:${authorID}`+"page success");
		})
		.catch((error) => {
			// Handle error if fetching data fails
			console.error("Error fetching data:", error);
			res.status(404).send("Post not found");
		});

});

// ports //
app.set("port", process.env.PORT || 8080);

app.listen(app.get("port"), function(){
	console.log(`Test link ${app.get("port")}`);
	console.log("Server listening on port " + '👉 ' + `http://localhost:${app.get("port")}`+ ' 👈');
});

