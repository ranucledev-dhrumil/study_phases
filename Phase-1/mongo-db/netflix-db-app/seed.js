// seed.js
// Run this once to populate the database with sample data
// Usage: node seed.js

const { MongoClient } = require("mongodb");
const { uri, dbName } = require("./config");

async function seed() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);

    // Clear existing data (so re-running seed doesn't duplicate)
    await db.collection("movies").deleteMany({});
    await db.collection("users").deleteMany({});
    await db.collection("reviews").deleteMany({});

    // Insert movies/shows
    const movieResult = await db.collection("movies").insertMany([
      {
        title: "Stranger Things",
        genre: "Sci-Fi",
        releaseYear: 2016,
        rating: 8.7,
        duration: 50,
        description: "Kids uncover supernatural mysteries in a small town."
      },
      {
        title: "The Crown",
        genre: "Drama",
        releaseYear: 2016,
        rating: 8.6,
        duration: 58,
        description: "The reign of Queen Elizabeth II."
      },
      {
        title: "Money Heist",
        genre: "Crime",
        releaseYear: 2017,
        rating: 8.2,
        duration: 45,
        description: "A group of robbers plan an elaborate heist."
      },
      {
        title: "Breaking Bad",
        genre: "Crime",
        releaseYear: 2008,
        rating: 9.5,
        duration: 47,
        description: "A chemistry teacher turns to making meth."
      },
      {
        title: "Bridgerton",
        genre: "Romance",
        releaseYear: 2020,
        rating: 7.3,
        duration: 60,
        description: "Regency-era romance among high society families."
      }
    ]);

    console.log(`${movieResult.insertedCount} movies inserted`);

    // Get inserted movie IDs so we can reference them in reviews
    const movieIds = Object.values(movieResult.insertedIds);

    // Insert users
    const userResult = await db.collection("users").insertMany([
      {
        name: "Dhrumil",
        email: "dhrumil@example.com",
        watchlist: [movieIds[0], movieIds[2]]
      },
      {
        name: "Aisha",
        email: "aisha@example.com",
        watchlist: [movieIds[1], movieIds[3], movieIds[4]]
      },
      {
        name: "Ravi",
        email: "ravi@example.com",
        watchlist: [movieIds[3]]
      }
    ]);

    console.log(`${userResult.insertedCount} users inserted`);

    const userIds = Object.values(userResult.insertedIds);

    // Insert reviews (linking users to movies)
    const reviewResult = await db.collection("reviews").insertMany([
      {
        movieId: movieIds[0],
        userId: userIds[0],
        rating: 9,
        comment: "Loved the nostalgia and the mystery!"
      },
      {
        movieId: movieIds[3],
        userId: userIds[1],
        rating: 10,
        comment: "Best show ever made."
      },
      {
        movieId: movieIds[3],
        userId: userIds[2],
        rating: 9,
        comment: "Intense from start to finish."
      },
      {
        movieId: movieIds[2],
        userId: userIds[0],
        rating: 8,
        comment: "Great heist plot, a bit long though."
      }
    ]);

    console.log(`${reviewResult.insertedCount} reviews inserted`);
    console.log("Seeding complete!");

  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await client.close();
  }
}

seed();