# 1. NumPy — Numerical computing foundation - NumPy's core object is the ndarray — a fast, fixed-type, multi-dimensional array. Much faster than Python lists for numerical work because it's backed by contiguous C arrays under the hood.
import numpy as np

arr = np.array([1,2,3,4,5])
print(arr.shape)          # (5,)
print(arr.dtype)          # int64 (fixed type, unlike Python lists)

matrix = np.array([[1, 2, 3], [4, 5, 6]])
print(matrix.shape)       # (2, 3)
# Indexing/slicing (similar to lists, but supports multi-dim)
print(matrix[0, 1])       # (row 0, col 1) -> 2
print(matrix[:, 1])       # (all rows, col 1) -> [2, 5]


# Creation helpers
zeros = np.zeros((3, 3))
ones = np.ones((2, 4))
range_arr = np.arange(0, 10, 2)      # like range() but returns ndarray - arange(start, end, steps)
lin = np.linspace(0, 1, 6)            # 5 evenly spaced values between 0 and 1


# Vectorized operations — no explicit loop needed
a = np.array([1, 2, 3])
b = np.array([10, 20, 30])
# print(a + b)              # [11, 22, 33] - elementwise, unlike Python lists!
# print(a * 2)               # [2, 4, 6]
# print(a > 1)                 # [False, True, True] - boolean mask

# Aggregate functions
print(arr.sum(), arr.mean(), arr.max(), arr.std())

# 2. Pandas — Data manipulation - Built on NumPy. Core objects: Series (1D, like a labeled array) and DataFrame (2D, like a spreadsheet/SQL table).
import pandas as pd

data = {
    "name": ["Mark", "Steven", "Jack"],
    "age": [25, 30, 22],
    "city": ["Delhi", "Mumbai", "Pune"]
}

df = pd.DataFrame(data)

print(df.head())              # first 5 rows
print(df.shape)                # (rows, cols)
print(df.columns)
print(df["age"])                # select a column (returns a Series)
print(df[["name", "age"]])       # select multiple columns

# Filtering (boolean masking, similar to NumPy)
print( "Here", df[df["age"] > 24])



# Adding/modifying columns
df["age_next_year"] = df["age"] + 1

# Reading/writing files
# df = pd.read_csv("data.csv")
# df.to_csv("output.csv", index=False)

# Common exploration
print(df.describe())          # stats summary
print(df.info())               # dtypes, non-null counts
print(df.isnull().sum())        # missing values per column

# GroupBy — like SQL GROUP BY
print(df.groupby("city")["age"].mean())

# Sorting
df.sort_values("age", ascending=False)

# Handling missing data
df.dropna()                    # drop rows with NaN
df.fillna(0)                    # fill NaN with a value

# 3. Matplotlib — Basic plotting (brief) - You'll mostly use this for quick sanity-checks/visualizations of data — depth isn't critical right now, just recognize the pattern (plt.<charttype>() → configure labels → plt.show()).
import matplotlib.pyplot as plt

ages = [25, 30, 22, 40]
names = ["Mark", "Steven", "Jack", "Anu"]

plt.bar(names, ages)
plt.xlabel("Name")
plt.ylabel("Age")
plt.title("Age by Person")
plt.show()

plt.plot([1, 2, 3, 4], [1, 4, 9, 16])   # line plot
plt.show()