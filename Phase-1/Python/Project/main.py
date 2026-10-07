from display import show_banner, show_stats, show_total, show_attack, show_heal, show_no_mana, show_spell
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
        show_attack(self.name, target.name, damage)

    def heal(self, amount):
        self.health += amount
        show_heal(self.name, amount)

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


class Warrior(Character):
    def __init__(self, name, health, attack_power, defense):
        super().__init__(name, health, attack_power)
        self.defense = defense

    def attack(self, target):
        self.deal_damage(target, multiplier=1.5)


class Mage(Character):
    def __init__(self, name, health, attack_power, mana=50):
        super().__init__(name, health, attack_power)
        self.mana = mana

    def cast_spell(self, target):
        if self.mana < 20:
            show_no_mana(self.name)
            return

        self.mana -= 20
        damage = self.attack_power * 2
        target.health = target.health - damage
        show_spell(self.name, target.name, damage)

    def attack(self, target):
        self.deal_damage(target)


class Healer(Character):
    def __init__(self, name, health, attack_power):
        super().__init__(name, health, attack_power)

    def attack(self, target, multiplier=1):
        self.deal_damage(target)


class Damageable(Protocol):
    def take_damage(self, amount: int) -> None: ...


def apply_environmental_damage(entity: Damageable, amount: int):
    entity.take_damage(amount)
    print(f"{amount} environmental damage applied!")


# THE FIX: call attacker.attack(target), NOT attacker.deal_damage(target).
# attack() is the polymorphic entry point - each subclass defines its own
# version (Warrior applies 1.5x, Mage/Healer just call deal_damage with
# defaults). Calling deal_damage() directly bypasses that override entirely.
def battle_round(attacker, target):
    if isinstance(attacker, Mage) and attacker.mana >= 20:
        attacker.cast_spell(target)
    else:
        attacker.attack(target)

    print(str(target))


if __name__ == "__main__":
    show_banner("RPG BATTLE SYSTEM")

    # Create mixed characters
    w = Warrior("Mark", 100, 15, 20)
    m = Mage("Steven", 100, 25)
    h = Healer("Grace", 100, 15)
    w2 = Warrior("Jack", 100, 15, 20)

    characters = [w, m, h, w2]

    # Stage 4: polymorphic battle loop
    for i in range(len(characters)):
        attacker = characters[i]
        target = characters[(i + 1) % len(characters)]
        battle_round(attacker, target)

    # Stage 4: sorted by remaining health
    print("\nSorted by health:")
    for character in sorted(characters):
        print(character)

    # Stage 5: Protocol
    print("\nEnvironmental damage:")
    apply_environmental_damage(w, 10)

    # Stage 5: ABC enforcement
    print("\nAbstract class test:")
    try:
        c1 = Character()
    except TypeError:
        print("TypeError: can't instantiate abstract class")

    show_total(Character.total_characters)