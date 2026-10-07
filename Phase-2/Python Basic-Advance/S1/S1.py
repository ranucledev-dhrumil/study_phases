#interactive REPL (Read-Eval-Print Loop) is a command-line environment that allows users to input code, evaluate it immediately, and display the result in a continuous loop.

# 2. Variables & Data Types
# Python is dynamically typed
x = 10          # int
y = 3.14        # float
name = "Ravi"   # str
is_valid = True # bool
z = None        # Python's "null" - <class 'NoneType'>
# complex type

# Type casting: int("5"), str(5), float("3.2")

# Dynamic typing gotcha: since types aren't fixed, x = 5; x = "now a string" is legal — no compiler error like Java would throw.

# print(type(x))
# print(type(y))

# print(type(name))
# Strings: immutable, support slicing (name[0:2]), f-strings for formatting: f"Hello {name}, you are {age}"

# print(type(is_valid))
# print(type(z))

# 3. Operators: 
# Arithmetic: (+, -, *, /, //, %, **) // -  is floor division, **  - is power
# Comparison: == != > < >= <=
# Logical: and, or, not (not &&, ||, ! like Java)
# == compares value, "is" compares object identity (important gotcha coming from Java's ==/.equals() confusion — in Python it's flipped).

# 4. Control Flow
# age = 20
# if age >= 18:
#     print("Adult")
# elif age >= 13:
#     print("Teen")
# else:
#     print("Child")

# for loop - iterates over a sequence (like Java's for-each)
for i in range(5):       # range(start, stop, step) — stop is exclusive.
    # print(i)
    pass                 # break, continue

# while loop
n = 0
while n < 5:
    n += 1               # no n++ in Python!

# for-else
# while-else
# break → immediately exits the loop and skips the else block.
# for i in range(5):
#     if i == 2:
#         break
# else:
#     print("Loop completed normally")

# for i in range(5):
#     print(i)
# else:
#     print("Loop completed normally")

# There are four common types:

# List comprehension: 
# squares = []
# for x in range(5):
#     squares.append(x ** 2)

squares = [x ** 2 for x in range(5)]
evens = [x for x in range(20) if x % 2 == 0] # [what_to_store for each_item in collection if condition]

# Set comprehension
numbers = [1, 2, 2, 3, 3, 4]
unique = {x for x in numbers}

# Dictionary comprehension
squares = {x: x ** 2 for x in range(5)} # {key_expression: value_expression for item in iterable}

# Generator expression
squares = (x ** 2 for x in range(5))

# x = 5
# y = "5"
# print(x == y)
# print(str(x) == y)

# count = 0
# for i in range(5):
#     if i == 3:
#         break
# else:
#     count = 100
# print(count)