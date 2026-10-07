nums = [4, 15, 22, 8, 42, 3, 19, 6, 30, 11]

for num in nums:
    if num % 2 == 0:
        print(f"{num} is even")
    else:
        print(f"{num} is odd")
    if num % 5 == 0:
        print(f"{num} is multiple of 5")

greaterThanTen = [x for x in nums if x > 10]
print(greaterThanTen)

total = 0
for num in nums:
    total = num+total

avg = total / len(nums)

print(f"Sum: {total}, Average: {avg:.2f}")