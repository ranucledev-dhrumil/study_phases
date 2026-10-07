# 1. Lists: Mutable, ordered collections - heterogeneous by default (can mix types)
fruits = ["apple", "banana", "cherry"]
fruits.append("date")          # add to end
fruits.insert(1, "mango")      # insert at index
fruits.remove("banana")        # remove by value
fruits.pop()                   # remove & return last item
fruits.pop(0)                  # remove & return item at index
fruits.sort()                  # in-place sort
fruits.reverse()
print(fruits[-1])              # negative indexing = from the end
print(fruits[1:3])             # slicing: [start:stop] (stop exclusive)
# len(fruits), "apple" in fruits (membership check — O(n) for lists).
# Lists are mutable — passing a list into a function and modifying it affects the original  

# 2. Tuples - Immutable, ordered - Used for fixed collections
point = (3, 4)
x, y = point                   # unpacking
single = (5,)                  # note the comma - required for single-element tuple  
# Faster than lists, hashable (can be used as dict keys, unlike lists).
# Common use: returning multiple values from a function — return x, y is actually returning a tuple.

# 3. Dictionaries - Key-value pairs - Ordered (insertion order preserved) - like Java's HashMap
person = {"name": "Ravi", "age": 25, "city": "Delhi"}
person["age"] = 26                     # update
person["email"] = "a@b.com"            # add new key
del person["city"]                     # remove key
print(person.get("phone", "N/A"))      # safe access with default
for key, value in person.items():
    print(key, value)
print(person.keys())
print(person.values())
print("name" in person)                # checks KEYS by default
# Keys must be hashable (immutable) — so tuples can be keys, lists cannot.
# .get() avoids KeyError that direct person["missing_key"] would raise.

# 4. Sets - Unordered collection of unique elements - like Java's HashSet
s = {1, 2, 3, 3, 2}      # becomes {1, 2, 3}
s.add(4)
s.remove(2)
a = {1, 2, 3}
b = {2, 3, 4}
print(a | b)              # union -> {1,2,3,4}
print(a & b)               # intersection -> {2,3}
print(a - b)                # difference -> {1}
print(a ^ b)                 # symmetric difference -> {1,4}
# Great for de-duplication and fast membership checks (in is O(1) avg, unlike lists).
# Empty set must be set(), NOT {} (that creates an empty dict!).


# 5. Nesting Structures - This nested-structure pattern is exactly what you'll see constantly in API responses, JSON configs, and ML datasets — worth getting comfortable with.
students = [
    {"name": "Ravi", "grades": [90, 85, 88]},
    {"name": "Anu", "grades": [70, 75, 80]}
]

for student in students:
    avg = sum(student["grades"]) / len(student["grades"])
    print(f"{student['name']}: {avg:.2f}")

# dict of lists
teams = {"blue": ["Ravi", "Anu"], "red": ["Sam", "Jo"]}

# nested dict
company = {
    "engineering": {"headcount": 50, "manager": "Priya"},
    "sales": {"headcount": 20, "manager": "Kabir"}
}
print(company["engineering"]["manager"])

t = (1, 2); t[0] = 5