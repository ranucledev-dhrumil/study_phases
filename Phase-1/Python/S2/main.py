class Account:
    def __init__(self, balance):
        # 1.self.balance = balance   # public — no restriction, accessible anywhere

        # 2. Single underscore _balance — "protected" by convention only: "internal use, don't touch from outside"
        # self._balance = balance   

        # 3. Double underscore __balance — name mangling
        self.__balance = balance  

        @property
        def balance(self):          # getter
            return self._balance

        @balance.setter
        def balance(self, value):   # setter
            if value < 0:
                raise ValueError("Balance can't be negative")
            self._balance = value

acc = Account(500)
# print(acc.__balance)          # AttributeError!
print(acc._Account__balance)  # 500 — still accessible, just renamed

acc2 = Account(100)
print(acc2.balance)     # calls the getter, prints 100
acc2.balance = 200       # calls the setter
acc2.balance = -50       # raises ValueError