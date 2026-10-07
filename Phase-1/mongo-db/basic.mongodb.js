use('ecommerce') // Create or switch to a database

// show dbs // List all databases


// show collections // List all collections in the current DB

// db.dropDatabase() // Drop current database

// db.products.createIndex({ name: 1 })

// db.products.getIndexes()

// db.products.find({ price: { $gt: 5000 } }).explain("executionStats")


// Total revenue from all orders:
// db.orders.aggregate([
//     { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
// ])

// Group by Status
// db.orders.aggregate([
//     { $group: { _id: "$status", totalOrders: { $sum: 1 } } }
// ])

// Lookup (Join Orders with Products)
// db.orders.aggregate([
//     {
//         $lookup: {
//             from: "products",
//             localField: "products.name",
//             foreignField: "name",
//             as: "productDetails"
//         }
//     }
// ])

// db.stats() // Show DB stats
// db.serverStatus() // Server info
// db.products.countDocuments() // Count documents
// db.products.renameCollection("items") // Rename collection
// db.products.drop() // Drop collection