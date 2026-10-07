import json
import pandas as pd
import numpy as np


employees = []


class EmployeeNotFoundError(Exception):
    """Raised when an employee is not found."""
    pass


def add_employee(employees, name, department, salary, years_experience, **extra_fields):
    employee = {
        "name": name,
        "department": department,
        "salary": salary,
        "years_experience": years_experience
    }

    employee.update(extra_fields)
    employees.append(employee)


def save_employees(employees, filename):
    with open(filename, "w") as f:
        json.dump(employees, f)


def load_employees(filename):
    try:
        with open(filename, "r") as f:
            return json.load(f)

    except FileNotFoundError:
        return []


def find_employee(employees, name):
    for employee in employees:
        if employee.get("name") == name:
            return employee

    raise EmployeeNotFoundError(f"Employee '{name}' not found")


def remove_employee(employees, name):
    for employee in employees:
        if employee.get("name") == name:
            employees.remove(employee)
            return employee

    raise EmployeeNotFoundError(f"Employee '{name}' not found")


def give_raise(employees, name, percent):
    employee = find_employee(employees, name)

    employee["salary"] = employee["salary"] + (
        employee["salary"] * (percent / 100)
    )

    return employee


if __name__ == "__main__":

    # ==========================================
    # PART 1 — ADD EMPLOYEES
    # ==========================================

    print("\n========== ADDING EMPLOYEES ==========")

    add_employee(
        employees,
        "Mark",
        "Tech",
        25000,
        4,
        email="mark@example.com"
    )

    add_employee(
        employees,
        "Alice",
        "Tech",
        60000,
        7
    )

    add_employee(
        employees,
        "John",
        "HR",
        40000,
        2
    )

    add_employee(
        employees,
        "Sarah",
        "HR",
        55000,
        6,
        email="sarah@example.com"
    )

    add_employee(
        employees,
        "David",
        "Finance",
        70000,
        10
    )

    add_employee(
        employees,
        "Emma",
        "Finance",
        45000,
        3
    )

    print(employees)


    # ==========================================
    # SAVE TO JSON AND RELOAD
    # ==========================================

    print("\n========== SAVE / LOAD JSON ==========")

    save_employees(employees, "employee_data.json")

    employees = load_employees("employee_data.json")

    print("Employees reloaded from JSON:")
    print(employees)


    # ==========================================
    # GIVE RAISE
    # ==========================================

    print("\n========== GIVE RAISE ==========")

    # Successful raise
    try:
        employee = give_raise(employees, "Mark", 10)

        print("After 10% raise:")
        print(employee)

    except EmployeeNotFoundError as e:
        print("Error:", e)


    # Nonexistent employee
    try:
        give_raise(employees, "Nobody", 10)

    except EmployeeNotFoundError as e:
        print("Handled error:", e)


    # ==========================================
    # REMOVE EMPLOYEE
    # ==========================================

    print("\n========== REMOVE EMPLOYEE ==========")

    # Successful removal
    try:
        removed = remove_employee(employees, "Emma")

        print("Removed employee:")
        print(removed)

    except EmployeeNotFoundError as e:
        print("Error:", e)


    # Nonexistent employee
    try:
        remove_employee(employees, "Nobody")

    except EmployeeNotFoundError as e:
        print("Handled error:", e)


    # ==========================================
    # PART 2 — BUSINESS LOGIC
    # ==========================================

    print("\n========== PART 2 — BUSINESS LOGIC ==========")


    # 7. Employees with > 5 years experience

    experienced_employees = [
        employee["name"]
        for employee in employees
        if employee["years_experience"] > 5
    ]

    print("\n--- Employees with > 5 Years Experience ---")
    print(experienced_employees)


    # 8. Unique departments

    unique_departments = {
        employee["department"]
        for employee in employees
    }

    print("\n--- Unique Departments ---")
    print(unique_departments)


    # 9. Department headcount

    dept_headcount = {}

    for employee in employees:
        department = employee["department"]

        if department not in dept_headcount:
            dept_headcount[department] = 0

        dept_headcount[department] += 1

    print("\n--- Department Headcount ---")
    print(dept_headcount)


    # ==========================================
    # PART 3 — ANALYTICS
    # ==========================================

    print("\n========== PART 3 — ANALYTICS ==========")


    # 10. Convert employees to DataFrame

    df = pd.DataFrame(employees)

    print("\n--- Employee DataFrame ---")
    print(df)


    # 11. Add annual bonus

    df["annual_bonus"] = np.where(
        df["years_experience"] > 3,
        df["salary"] * 0.10,
        df["salary"] * 0.05
    )

    print("\n--- DataFrame with Annual Bonus ---")
    print(df)


    # 12. Average salary per department

    avg_salary_by_department = (
        df.groupby("department")["salary"].mean()
    )

    print("\n--- Average Salary by Department ---")
    print(avg_salary_by_department)


    # 13. Department with highest average salary

    highest_avg_department = avg_salary_by_department.idxmax()

    print("\n--- Department with Highest Average Salary ---")
    print(highest_avg_department)


    # 14. NumPy salary statistics

    salary_array = df["salary"].to_numpy()

    mean_salary = np.mean(salary_array)
    median_salary = np.median(salary_array)
    std_salary = np.std(salary_array)
    salary_range = np.max(salary_array) - np.min(salary_array)

    print("\n--- Salary Statistics ---")
    print("Mean:", mean_salary)
    print("Median:", median_salary)
    print("Standard Deviation:", std_salary)
    print("Range:", salary_range)


    # 15. Employees above overall mean salary

    above_mean = df[df["salary"] > mean_salary]

    print("\n--- Employees Above Mean Salary ---")
    print(above_mean)


    # 16. Save final DataFrame to CSV

    df.to_csv("employees_report.csv", index=False)

    print("\n--- Reloaded CSV ---")

    loaded_df = pd.read_csv("employees_report.csv")

    print(loaded_df)