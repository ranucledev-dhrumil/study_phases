import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split

# Reading the csv
df = pd.read_csv("housing.csv")

numeric_columns = [
    'longitude',
    'latitude',
    'housing_median_age',
    'total_rooms',
    'total_bedrooms',
    'population',
    'households',
    'median_income'
]

# Syntax:
# scaler = StandardScaler()
# X_scaled = scaler.fit_transform()
# z = (X - mu) / sigma - 
# X - actual Value, mu - mean, sigma - std deviation
standardscalar = StandardScaler()
standardscaled = standardscalar.fit_transform(df[numeric_columns])

print("Standard Scaled Output:")
print(pd.DataFrame(standardscaled, columns = numeric_columns).head())

# scaler = MinMaxScaler()
# X_scaled = scaler.fit_transform()
# scaled = (X - Xmin) / (Xmax - Xmin)
minmaxscaler = MinMaxScaler()
minmaxscaled = minmaxscaler.fit_transform(df[numeric_columns])


print("MinMax Scaled Output:")
print(pd.DataFrame(minmaxscaled, columns = numeric_columns).head())
