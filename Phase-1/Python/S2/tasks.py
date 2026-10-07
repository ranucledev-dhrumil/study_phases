class Temperature:
        def __init__(self, celsius):
            self.celsius = celsius

        @property
        def celsius(self):
           return self.__celsius

        @celsius.setter
        def celsius(self, value):
            if value<-273.15:
                raise ValueError("Below absolute zero")
            self.__celsius = value

        @property
        def fahrenheit(self):
            return (self.__celsius*(9/5)+32)

        @fahrenheit.setter
        def fahrenheit(self, fvalue):
            self.celsius = (fvalue - 32) * 5/9

t1 = Temperature(29)
print(t1.celsius)
print(t1.fahrenheit)

t1.fahrenheit = 98.6
print(t1.celsius)

try: 
    t1.celsius = -300
except ValueError:
    print("Below absolute zero not allowed")


try: 
    t2 = Temperature(-299)
except ValueError:
    print("Below absolute zero not allowed")
