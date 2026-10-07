# class Dog:
#     def speak(self):
#         return "Woof"

# class Cat:
#     def speak(self):
#         return "Meow"

# class Duck:
#     def speak(self):
#         return "Quack"

# class Hello:
#     def speak(self):
#         return "hello"

# def make_it_speak(animal):
#     print(animal.speak())

# for a in [Dog(), Cat(), Duck(), Hello()]:
#     make_it_speak(a)


class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):          # defines behavior for +
        return Point(self.x + other.x, self.y + other.y)

    def __eq__(self, other):           # defines behavior for ==
        return self.x == other.x and self.y == other.y

    def __str__(self):                 # defines behavior for str()/print()
        return f"Point({self.x}, {self.y})"

p1 = Point(1, 2)
p2 = Point(3, 4)

p3 = p1 + p2         # calls p1.__add__(p2)
print(p3)            # calls p3.__str__() automatically -> Point(4, 6)
print(p1 == Point(1, 2))   # True, calls __eq__
# __add__ (+), __sub__ (-), __eq__ (==), __lt__ (<), __len__ (len()), __str__ (informal string, used by print/str()), __repr__ (developer-facing string, used in REPL/debugging)

