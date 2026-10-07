import pandas as pd

# Reading the csv
df = pd.read_csv("housing.csv")

# Null value in the dataset:
print(df.isnull().sum())
# Percentage of null values in dataset:
# print(df.isnull().mean() * 100)

# Dropping Null columns
drop_df = df.dropna()
# print(drop_df.isnull().sum())

# Filling null values:
df['total_bedrooms'].fillna(df['total_bedrooms'].mean(), inplace=True)
# print(df.isnull().sum())
# numbers - mean, median, 
# categorial values - mode

# Encoding values:
