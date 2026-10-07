import pandas as pd

# df = pd.DataFrame({"x": [1, 2, 3], "y": [4, 5, 6]})
# print(df["x"].sum())
# print(df.shape)
# print(df)

data = pd.DataFrame({
    "product": ["Pen",
        "Notebook",
        "Pen",
        "Notebook",
        "Notebook",
        "Pencil",
        "Eraser",
        "Pencil"
    ],
    "units_sold": [
         100,
        50,
        80,
        70,
        40,
        90,
        60,
        75
    ],
    "price": [
         10,
        50,
        10,
        50,
        50,
        5,
        8,
        5
    ]
})

df = pd.DataFrame(data)

df["revenue"] = df["units_sold"] * df["price"]

sum = df.groupby("product")["revenue"].sum()
top_product = sum.idxmax()
print(f"{top_product}: {sum.max()}")


numpyarray = df["revenue"].to_numpy()
# print(numpyarray.sum())
# print(numpyarray.mean())
# print(numpyarray.max())
# print(numpyarray.std())

# print(df["revenue"].mean())
# print(df[df["revenue"] > numpyarray.mean()])

df.to_csv("sales.csv", index=False)

loaded_df = pd.read_csv("sales.csv")

# print(loaded_df) 