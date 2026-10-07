def show_banner(text):
    width = max(len(text) + 8, 40)
    print("=" * width)
    print(text.center(width))
    print("=" * width)

def show_divider():
    print("-" * 40)

def show_health_bar(current, maximum, bar_length=20):
    current = max(0, current)
    ratio = current / maximum if maximum > 0 else 0
    filled = int(bar_length * ratio)
    bar = "#" * filled + "." * (bar_length - filled)
    return f"[{bar}] {current}/{maximum}"

def show_stats(name, health, max_health, attack_power):
    print(f"  {name:<15} HP: {show_health_bar(health, max_health):<28} ATK: {attack_power}")

def show_attack(attacker, target, damage):
    print(f"  ⚔  {attacker} attacks {target} for {damage} damage!")

def show_death(name):
    print(f"  💀 {name} has fallen!")

def show_heal(name, amount):
    print(f"  ✚  {name} heals for {amount} HP!")

def show_spell(name, target_name, damage):
    print(f"  ✨ {name} casts a spell on {target_name} for {damage} damage!")

def show_no_mana(name):
    print(f"  ⚡ {name} doesn't have enough mana to cast!")

def show_total(count):
    print(f"\n  [System] Total characters created so far: {count}")