# 1. Functions
def greet(name, greeting="Hello"):     # default arg
    return f"{greeting}, {name}!"

print(greet("Ravi"))
print(greet("Ravi", "Hi"))
print(greet(name="Ravi", greeting="Hey"))   # keyword args  

# *args — variable positional args (collected as a tuple):
def total(*numbers):
    return sum(numbers)
total(1, 2, 3)   

# **kwargs — variable keyword args (collected as a dict):
def profile(**info):
    for k, v in info.items():
        print(k, v)
profile(name="Ravi", age=25)

# Order matters in definition: def f(a, b=1, *args, **kwargs):

# Return values: Python functions can return multiple values via tuple unpacking:
def min_max(nums):
    return min(nums), max(nums)
lo, hi = min_max([3, 1, 4, 1, 5])

# Lambda (anonymous functions) — like Java lambdas, but Python's are single-expression only:
square = lambda x: x ** 2
sorted_list = sorted([3, 1, 2], key=lambda x: -x)
# Scope: local vs global — a function can read a global variable but needs the global keyword to reassign it (uncommon/discouraged in practice).

# 2. Modules
# A module is just a .py file; 
# a package is a folder of modules with an __init__.py.
import math
print(math.sqrt(16))

from math import sqrt, pi
print(sqrt(16))

import numpy as np      # common alias pattern you'll use constantly later

# Your own modules: if you have utils.py with a function add(), another file in the same folder does from utils import add.
# pip install <package> installs third-party packages (like Maven/Gradle dependencies in Java, but simpler — no build file needed for basic scripts).
# if __name__ == "__main__": — guards code that should only run when the file is executed directly, not when imported. You'll see this in almost every serious Python script.

# 3. File Handling
# Writing
with open("data.txt", "w") as f:
    f.write("Hello\n")
    f.write("World\n")

# Reading
with open("data.txt", "r") as f:
    content = f.read()          # whole file as one string

with open("data.txt", "r") as f:
    for line in f:               # memory-efficient line-by-line
        print(line.strip())      # .strip() removes trailing \n

with open("data.txt", "a") as f:  # append mode
    f.write("New line\n")

# with is a context manager — auto-closes the file even if an error occurs (like Java's try-with-resources). Always prefer with over manual open()/close()
# Modes: "r" read, "w" write (overwrites), "a" append, "r+" read+write.
# For structured data, json module: json.dump(data, f) / json.load(f) to read/write dicts as JSON

# 4. Error Handling
try:
    x = int(input("Enter a number: "))
    result = 10 / x
except ValueError:
    print("That wasn't a valid number")
except ZeroDivisionError:
    print("Can't divide by zero")
except Exception as e:            # catch-all, last resort
    print(f"Unexpected error: {e}")
else:
    print("No errors occurred, result:", result)   # runs only if try succeeded
finally:
    print("This always runs")     # cleanup, like Java's finally

def withdraw(balance, amount):
    if amount > balance:
        raise ValueError("Insufficient funds")
    return balance - amount

# Custom exception classes (useful for larger apps):
class InsufficientFundsError(Exception):
    pass