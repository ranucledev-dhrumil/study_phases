function createCounter(start = 0){
    let count = start

    function increment() {
        count++;
        return count;
    };

    function decrement() {
        count--;
        return count;
    };

    function getValue() {
        return count;
    };

    return {
        increment,
        decrement,
        getValue
    };
}

module.exports = createCounter