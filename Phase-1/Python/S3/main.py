# 1. Basic single inheritance
# class Animal:
#     def __init__(self, name):
#         self.name = name

#     def speak(self):
#         print(f"{self.name} makes a sound")

# 2. Overriding + super()
# class Dog(Animal):          # Dog inherits from Animal
#     def __init__(self, name, breed):
#         super().__init__(name)   # calls Animal's __init__
#         self.breed = breed

#     def speak(self):             # override
#         print(f"{self.name} barks")

# d = Dog("Rex")
# d.speak()   # Rex makes a sound — inherited from Animal

# Multiple inheritance — Python allows this, Java doesn't (for classes)
# class Flyer:
#     def fly(self):
#         print("Flying")

# class Swimmer:
#     def swim(self):
#         print("Swimming")

# class Duck(Flyer, Swimmer):   # inherits from BOTH
#     pass

# d = Duck()
# d.fly()
# d.swim()


# 4. MRO — Method Resolution Order
class A:
    def greet(self):
        print("A")

class B(A):
    def greet(self):
        print("B")

class C(A):
    def greet(self):
        print("C")

class D(B, C):
    pass

d = D()
d.greet()   # ??? — B or C or A?
print(D.__mro__)