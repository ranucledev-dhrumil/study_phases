console.log(process.argv)

if (process.argv[2]) {
    console.log("Hello, " + process.argv[2]+ "!")
}
else{
    console.log("Hello, Stranger")
}

console.log(process.env.OS)

// It will not upgrade to 1.5.0 — No.
// The ~ (tilde) allows patch-level updates within the same minor version: ~1.4.0  →  >=1.4.0 and <1.5.0
// ^1.4.0 would allow minor and patch updates: ^1.4.0 → >=1.4.0 and <2.0.0

console.log("Hello")