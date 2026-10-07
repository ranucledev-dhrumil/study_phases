contacts = []

def add_contact(contacts, name, phone, **extra_fields):

    contact = {
        "name": name,
        "phone": phone,
    }
    for k,v in extra_fields.items():
        contact[k] = v 

    contacts.append(contact)
            

add_contact(contacts, "hello", "21290192019", city="hello")

import json

def save_contacts(contacts, filename):
    with open(filename, "w") as f:
        json.dump(contacts, f)

save_contacts(contacts, "data.json")

def load_contacts(filename):
    try: 
        with open(filename, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# print(load_contacts("data.json"))

class ContactNotFoundError(Exception):
    pass

def find_contact(contacts, name):

    for contact in contacts:
        if contact.get("name") == name:
            return contact
        
    raise ContactNotFoundError(f"Contact '{name}' not found")

if __name__ == "__main__":
     # 2. Add three contacts
    add_contact(contacts, "Mark", "1234567890")
    add_contact(contacts, "Steven", "9876543210", city="Ahmedabad")
    add_contact(contacts, "Jack", "5555555555", email="jack@gmail.com", city="Mumbai")

    # 3. Save contacts to JSON
    save_contacts(contacts, "data.json")

    # 4. Load contacts back from JSON
    loaded_contacts = load_contacts("data.json")

    print("Loaded contacts:")
    print(loaded_contacts)

    # 5. Find a contact that DOES exist
    print("\nSearching for Mark:")

    try:
        contact = find_contact(loaded_contacts, "Mark")
        print(contact)
    except ContactNotFoundError as e:
        print(e)

    # 6. Find a contact that DOES NOT exist
    print("\nSearching for Bob:")

    try:
        contact = find_contact(loaded_contacts, "Bob")
        print(contact)
    except ContactNotFoundError as e:
        print(f"Could not find contact: {e}")