class Vector2D:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, vec2):
        newVectorX = self.x + vec2.x
        newVectorY = self.y + vec2.y    
        return Vector2D(newVectorX, newVectorY)
    
    def __sub__(self, vec2):
        newVectorX = self.x - vec2.x
        newVectorY = self.y - vec2.y    
        return Vector2D(newVectorX, newVectorY)

    def __eq__(self, vec2):
        if self.x == vec2.x and self.y == vec2.y:
            return True
        return False

    def __str__(self):
        return f"Vector2D({self.x}, {self.y})"
    
    def __repr__(self):
        return self.__str__()

    def __len__(self):
        return int((self.x**2 + self.y**2)**0.5)

v1 = Vector2D(5,7)
v2 = Vector2D(8,2)
v3 = Vector2D(8,2)

# print(v1+v2)
# print(v1-v2)
# print(v1==v2)
# print(v2==v3)
# print(v1)
# print(len(v1))
# print([v1, v2])


def print_info(obj):
    print(obj)
    print(len(obj))

# print_info(Vector2D(3,4))
# print_info([1, 2, 3])


def add(num1, num2):
    return num1+num2

def add(num1, num2, num3):
    return num1+num2+num3

# print(add(1,2)) # will not work
# print(add(2,4,5))


# *args
#    ↓
# positional arguments
#    ↓
# tuple
def addArgs(*args):
    return sum(args)

# print(addArgs(1,2))
# print(addArgs(2,4,5))

# kwargs is a dictionary.
# **kwargs
#    ↓
# keyword arguments
#    ↓
# dictionary
def show(**kwargs):
    print(kwargs)

show(name="Mark", salary=250000, team_size=10)
