class BankAccount:
    bank_name = "Global Bank"
    

    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self.transaction_log = []

    @classmethod
    def from_string(cls, data):
        owner, amount = data.split("-")
        return cls(owner, int(amount))

    def deposit(self, amount):
        self.balance += amount
        self.transaction_log.append(f"Deposited ${amount}")

    def withdraw(self, amount):
        self.balance -= amount
        self.transaction_log.append(f"Withdrew ${amount}")

ba1 = BankAccount("Mark", 20000)
ba2 = BankAccount("Steven", 20000)

ba3 = BankAccount.from_string("John-20000")

ba2.deposit(2000)
ba3.deposit(3000)

ba2.deposit(100)
ba3.deposit(200)

print(ba2.owner)
print(ba2.balance)
print(ba2.transaction_log)

print(ba3.owner)
print(ba3.balance)
print(ba3.transaction_log)