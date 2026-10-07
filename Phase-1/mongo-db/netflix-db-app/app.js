// app.js
// Connects to MongoDB, fetches data, and prints it to console
// Usage: node app.js

const { MongoClient } = require("mongodb");
const { uri, dbName } = require("./config");

async function main() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB\n");

    const db = client.db(dbName);

    // 1. Fetch all movies
    console.log("===== ALL MOVIES =====");
    const allMovies = await db.collection("movies").find().toArray();
    allMovies.forEach(movie => {
      console.log(`${movie.title} (${movie.releaseYear}) - ${movie.genre} - Rating: ${movie.rating}`);
    });

    // 2. Fetch movies with rating greater than 8.5, sorted by rating descending
    console.log("\n===== TOP RATED MOVIES (rating > 8.5) =====");
    const topMovies = await db.collection("movies")
      .find({ rating: { $gt: 8.5 } })
      .sort({ rating: -1 })
      .toArray();
    topMovies.forEach(movie => {
      console.log(`${movie.title} - Rating: ${movie.rating}`);
    });

    // 3. Fetch movies in specific genres using $in
    console.log("\n===== CRIME OR SCI-FI MOVIES =====");
    const genreMovies = await db.collection("movies")
      .find({ genre: { $in: ["Crime", "Sci-Fi"] } })
      .toArray();
    genreMovies.forEach(movie => {
      console.log(`${movie.title} - ${movie.genre}`);
    });

    // 4. Fetch all users and their watchlists
    console.log("\n===== USERS & WATCHLISTS =====");
    const users = await db.collection("users").find().toArray();
    for (const user of users) {
      const watchlistMovies = await db.collection("movies")
        .find({ _id: { $in: user.watchlist } })
        .toArray();
      const titles = watchlistMovies.map(m => m.title).join(", ");
      console.log(`${user.name} (${user.email}) -> Watchlist: ${titles}`);
    }

    // 5. Fetch reviews for a specific movie, joined manually with user names
    console.log("\n===== REVIEWS FOR 'Breaking Bad' =====");
    const breakingBad = await db.collection("movies").findOne({ title: "Breaking Bad" });
    const reviews = await db.collection("reviews")
      .find({ movieId: breakingBad._id })
      .toArray();

    for (const review of reviews) {
      const reviewer = await db.collection("users").findOne({ _id: review.userId });
      console.log(`${reviewer.name} rated it ${review.rating}/10: "${review.comment}"`);
    }

    // 6. Pagination example - page 1 of movies, 2 per page, sorted by title
    console.log("\n===== MOVIES - PAGE 1 (2 per page, sorted by title) =====");
    const pageSize = 2;
    const page = 1;
    const paginatedMovies = await db.collection("movies")
      .find()
      .sort({ title: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    paginatedMovies.forEach(movie => {
      console.log(movie.title);
    });

  } catch (err) {
    console.error("Error running app:", err);
  } finally {
    await client.close();
    console.log("\nConnection closed.");
  }
}

main();