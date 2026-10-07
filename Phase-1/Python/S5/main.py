# 1. abc.ABC + @abstractmethod — Python's abstract classes
from abc import ABC, abstractmethod
# abc -> abstract base classes

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

    @abstractmethod
    def perimeter(self):
        pass

    def describe(self):              # regular method — concrete, shared by all subclasses
        print(f"Area: {self.area()}, Perimeter: {self.perimeter()}")
# You cannot instantiate Shape directly: 
# Shape() raises TypeError: Can't instantiate abstract class Shape with abstract methods area, perimeter
# Any subclass that doesn't implement all @abstractmethods also can't be instantiated.
# describe() is a normal concrete method — ABCs can mix abstract + concrete methods, just like Java abstract classes.

class Circle(Shape):
    def __init__(self, r):
        self.r = r

    def area(self):
        return 3.14159 * self.r ** 2

    def perimeter(self):
        return 2 * 3.14159 * self.r
# This is nominal typing — Circle is only considered a Shape because it explicitly wrote class Circle(Shape). Inheritance is required.

# 2. Protocols — structural typing (PEP 544), no Java equivalent