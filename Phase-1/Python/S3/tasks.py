class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def raise_salary(self, percent):
        self.salary = self.salary + (self.salary * (percent/100))

    def info(self):
        return f"Name: {self.name}, Salary: {self.salary}"

class Manager(Employee):
    def __init__(self, name, salary, team_size):
        super().__init__(name, salary)
        self.team_size = team_size

    def info(self):
        return super().info() + f", Team Size: {self.team_size}"

class BonusMixin():
    def give_bonus(self, amount):
        self.salary += amount

class SeniorManager(Manager, BonusMixin):
    pass

e1 = SeniorManager("Mark", 250000, 10)
e1.raise_salary(10)
e1.give_bonus(5000)
print(e1.info())

print(SeniorManager.__mro__) 
# MRO: SeniorManager -> Manager -> Employee -> BonusMixin -> object
# Because SeniorManager(Manager, BonusMixin) lists Manager first, Python checks
# Manager's chain (Manager -> Employee) fully before falling through to BonusMixin,
# per C3 linearization (left-to-right, depth-first, no reordering ancestors before descendants)