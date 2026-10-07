use('ecommerce');

// db.sales.insertMany([
//     { _id: 1, item: "Apple", price: 10, quantity: 5, category: "Fruit" },
//     { _id: 2, item: "Banana", price: 5, quantity: 10, category: "Fruit" },
//     { _id: 3, item: "Carrot", price: 8, quantity: 6, category: "Vegetable" },
//     { _id: 4, item: "Tomato", price: 6, quantity: 8, category: "Vegetable" },
//     { _id: 5, item: "Mango", price: 15, quantity: 3, category: "Fruit" }
// ]);



// get only the sales where category is "Fruit" :
// db.sales.aggregate([
//     { $match: { category: "Fruit" } }
// ])

// display only item and price , and hide _id :
// db.sales.aggregate([
//     { $project: { item:1, _id:0 }}
// ])

// calculate total sales (price × quantity) for each category:
// db.sales.aggregate([
//     { 
//         $group: 
//         { 
//             _id: "$category",
//             totalSales: {$sum: {$multiply: ["$price", "$quantity"]}}
//         } 
//     }
// ])

// Sort the total sales in descending order:
// db.sales.aggregate([
//     { 
//         $group: 
//         { 
//             _id: "$category",
//             totalSales: {$sum: {$multiply: ["$price", "$quantity"]}}
//         } 
//     },

//     { $sort: { totalSales: -1 } }
// ])

// Find total sales for only Fruits:
// db.sales.aggregate([
//     { $match: { category: "Fruit" } },
//     {
//         $group: {
//             _id: null,
//             totalFruitSales: { $sum: { $multiply: ["$price", "$quantity"] } }
//         }
//     }
// ]);


// db.products.createIndex({ name: 1 }) // Ascending index on 'name' field

// db.products.getIndexes() // List all indexes on 'products' collection

