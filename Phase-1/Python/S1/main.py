# class Dog:
#     species = "German Shephard"
#     tricks = []   # class attribute — DANGEROUS as a mutable default

#     def __init__(self, name, age):
#         self.name = name
#         self.age = age

#     def add_trick(abc, trick):
#         abc.tricks.append(trick)   # mutates the SHARED list!

# d1 = Dog("rex", 3)
# d2 = Dog("max", 3)

# d1.add_trick("hello")
# print(d1.tricks)
# print(d2.tricks)

# class Car:
#     def __init__(self, brand, year):
#         self.brand = brand
#         self.year = year

#     def describe():
#         print(f"This is a {self.year} {self.brand}")

# c1 = Car("Mercedes", 2021)
# c2 = Car("Toyota", 2020)

# c1.describe()
# c2.describe()

class Car:
    def __init__(self, brand, year):
        self.brand = brand
        self.year = year

    @classmethod
    def from_string(cls, car_str):
        brand, year = car_str.split("-")
        return cls(brand, int(year))

c1 = Car("Toyota", 2021)
c2 = Car.from_string("Honda-2019")

print(c1.brand, c1.year)
print(c2.brand, c2.year)