import pandas as pd
from sklearn.preprocessing import LabelEncoder

# Reading the csv
df = pd.read_csv("housing.csv")

df_label = df.copy()

# Label Encoder: works in only column where there are 2 unique data
# We cant encode ocean proximity with label encoder but we did it for demonstartion purpose only
# le = LabelEncoder()
# df_label['ocean_proximity_label_encoded'] = le.fit_transform(df['ocean_proximity'])

# print("Label Encoded Data:")
# print(df_label[['longitude', 'latitude', 'ocean_proximity', 'ocean_proximity_label_encoded']])

# One-Hot Encoding:
df_encoded = pd.get_dummies(df_label, columns=['ocean_proximity'])
# Converting to 0s and 1s instead of True and False
# df_encoded = pd.get_dummies(
#     df_label,
#     columns=['ocean_proximity'],
#     dtype=int
# )

print("One-Hot Encoded Data:")
print(df_encoded)

# After encoding it, then making it 1s and 0s:
# Find only True/False columns
# bool_cols = df_encoded.select_dtypes(include='bool').columns
# # Convert only those columns to 0/1
# df_encoded[bool_cols] = df_encoded[bool_cols].astype(int)