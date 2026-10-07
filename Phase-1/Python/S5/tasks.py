from abc import ABC, abstractmethod

class PaymentMethod(ABC):

    @abstractmethod 
    def pay(self, amount):
        pass

    @abstractmethod 
    def refund(self, amount):
        pass

    def receipt(self, amount):
        result = self.pay(amount)
        print(f"Processing ${amount} via {result}")

class CreditCard(PaymentMethod):
    def pay(self, amount):
        return f"Credit Card payment of {amount}"

    def refund(self, amount):
        return f"Credit Card refund of {amount}"

class UPI(PaymentMethod):
    def pay(self, amount):
        return f"UPI payment of {amount}"

    def refund(self, amount):
        return f"UPI refund of {amount}"


try:
    p1 = PaymentMethod()
except TypeError:
    print("Can't instanstiate Payment Method- abstract methods")

from typing import Protocol

class Loggable(Protocol):
    def log(self, message: str) -> None: 
        ...

class ThirdPartyLogger:
    def log(self, message):
        print(message)

def process(logger: Loggable):
    return logger.log("Processing started")

process(ThirdPartyLogger())