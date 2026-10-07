from abc import ABC, abstractmethod
from typing import Protocol


class Character(ABC):
    total_characters = 0

    def __init__(self, name, health, attack_power):
        self.name = name
        self.__health = health
        self.attack_power = attack_power
        self.max_health = health
        Character.total_characters += 1

    @property
    def health(self):
        return self.__health

    @health.setter
    def health(self, value):
        self.__health = max(0, min(value, self.max_health))

    @classmethod
    def from_dict(cls, data):
        return cls(
            data["name"],
            data["health"],
            data["attack_power"]
        )

    @abstractmethod
    def attack(self, target, multiplier=1.0):
        pass

    def deal_damage(self, target, multiplier=1.0):
        damage = self.attack_power * multiplier
        target.health = target.health - damage
        return damage

    def heal(self, amount):
        self.health += amount
        return amount

    def take_damage(self, amount):
        self.health -= amount

    def is_alive(self):
        return self.__health > 0

    def __str__(self):
        return f"{self.name} (HP: {self.health}/{self.max_health})"

    def __lt__(self, other):
        return self.health < other.health

    def __eq__(self, other):
        return self.name == other.name and self.health == other.health

    def to_dict(self):
        return {
            "name": self.name,
            "type": type(self).__name__,
            "health": self.health,
            "max_health": self.max_health,
            "attack_power": self.attack_power,
            "alive": self.is_alive(),
        }


class Warrior(Character):
    def __init__(self, name, health, attack_power, defense=10):
        super().__init__(name, health, attack_power)
        self.defense = defense

    def attack(self, target):
        return self.deal_damage(target, multiplier=1.5)

    def to_dict(self):
        data = super().to_dict()
        data["defense"] = self.defense
        return data


class Mage(Character):
    def __init__(self, name, health, attack_power, mana=50):
        super().__init__(name, health, attack_power)
        self.mana = mana
        self.max_mana = mana

    def cast_spell(self, target):
        if self.mana < 20:
            return None  # not enough mana

        self.mana -= 20
        damage = self.attack_power * 2
        target.health = target.health - damage
        return damage

    def attack(self, target):
        return self.deal_damage(target)

    def to_dict(self):
        data = super().to_dict()
        data["mana"] = self.mana
        data["max_mana"] = self.max_mana
        return data


class Healer(Character):
    def __init__(self, name, health, attack_power):
        super().__init__(name, health, attack_power)

    def attack(self, target, multiplier=1):
        return self.deal_damage(target)


class Damageable(Protocol):
    def take_damage(self, amount: int) -> None: ...


def apply_environmental_damage(entity: Damageable, amount: int):
    entity.take_damage(amount)