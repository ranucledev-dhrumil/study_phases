students = [
    {
        "name": "Mark",
        "subjects": {
            "Maths": 30,
            "English": 27,
            "Science": 29
        }
    },
    {
        "name": "Steven",
        "subjects": {
            "Maths": 10,
            "English": 20,
            "Science": 15
        }
    },
    {
        "name": "Jack",
        "subjects": {
            "Maths": 30,
            "English": 29,
            "Science": 29
        }
    },
    {
        "name": "Bob",
        "subjects": {
            "Maths": 9,
            "English": 12,
            "Science": 14
        }
    },
]

max = 0
unique_subjects = set()

max_total = 0
max_name = ""

for student in students:
    total = 0

    for subject_score in student["subjects"].values():
        total += subject_score

    if total > max_total:
        max_total = total
        max_name = student["name"]


print(f"Max Average - {max_name}: {(max_total / 3):.2f}")



subject_marks = {}
for student in students:
    for subject in student["subjects"]:
        score = student["subjects"][subject]
        
        if subject not in subject_marks:
            subject_marks[subject] = []

        subject_marks[subject].append(score)

print(subject_marks)

highest_avg_subject = ""
highest_avg = 0;

for subject, scores in subject_marks.items():
    average = sum(scores) / len(scores)
    if average > highest_avg:
        highest_avg = average
        highest_avg_subject = subject

print(f"{highest_avg_subject}: {highest_avg}")
