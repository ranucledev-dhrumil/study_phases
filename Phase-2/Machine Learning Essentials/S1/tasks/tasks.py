import pandas as pd
import matplotlib.pyplot as plt
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)
import numpy as np

# 1. Problem Framing:
# We want to understand the factors that influence house values in California and use the available housing and demographic information to estimate the median house value of a given area.

# 2.Data Loading
df = pd.read_csv("housing.csv")

# 3. EDA
# print(df.head()) # Shows First Five Rows

# print(df.isnull().sum()) # Check missing values

# print(df.dtypes) # Check missing values

# print(df.describe()) # Shows the data related statistics

# plt.figure(figsize=(8,15))
# plt.hist(df["median_income"], bins = 30)
# plt.title('Distribution of Median Income')
# plt.xlabel('Median Income')
# plt.ylabel('Frequency')
# plt.show() # The distribution is right-skewed.

# plt.figure(figsize=(8, 5))
# plt.boxplot(df['median_income'].dropna())
# plt.title('Boxplot of Median Income')
# plt.ylabel('Median Income')
# plt.show() # The boxplot shows a substantial number of observations above the upper whisker.

# 4. Data Cleaning and Preparation
# Calculate IQR
Q1 = df['median_income'].quantile(0.25)
Q3 = df['median_income'].quantile(0.75)

IQR = Q3 - Q1

# Calculate bounds
lower_bound = Q1 - 1.5 * IQR
upper_bound = Q3 + 1.5 * IQR

# Count outliers
outliers = (
    (df['median_income'] < lower_bound) |
    (df['median_income'] > upper_bound)
)
# print("Number of outliers:", outliers.sum())

# Cap outliers
df['median_income'] = df['median_income'].clip(
    lower=lower_bound,
    upper=upper_bound
)

# Verify
# print("Maximum after capping:", df['median_income'].max())
# plt.figure(figsize=(8, 5))
# plt.boxplot(df['median_income'])
# plt.title('Median Income After IQR Capping')
# plt.ylabel('Median Income')
# plt.show()

# Missing values
imputer = SimpleImputer(strategy='median')

# print(f"Before Imputation, missing values: {df['total_bedrooms'].isnull().sum()}")
df[['total_bedrooms']] = imputer.fit_transform(
    df[['total_bedrooms']]
)
# print(f"After imputation missing values: {df['total_bedrooms'].isnull().sum()}")

# 5. Feature Engineering:
# Create age groups
bins = [0, 10, 20, 30, 40, 50, float('inf')]

labels = [
    'New',
    'Young',
    'Middle-aged',
    'Mature',
    'Old',
    'Very Old'
]

df['age_group'] = pd.cut(
    df['housing_median_age'],
    bins=bins,
    labels=labels,
    right=False
)

# Create income-to-age ratio
df['income_per_age'] = (
    df['median_income'] /
    df['housing_median_age']
)

# Inspect new features
# print(df[['housing_median_age',
#           'age_group',
#           'median_income',
#           'income_per_age']].head())

# print("\nAge group distribution:")
# print(df['age_group'].value_counts().sort_index())

# print(df['ocean_proximity'].unique())
df = pd.get_dummies(
    df,
    columns=['ocean_proximity'],
    drop_first=True
)
# print(df.columns)

age_order = {
    'New': 0,
    'Young': 1,
    'Middle-aged': 2,
    'Mature': 3,
    'Old': 4,
    'Very Old': 5
}

df['age_group_encoded'] = df['age_group'].map(age_order)

df['age_group_encoded'] = df['age_group'].map(age_order).astype(int)
df = df.drop(columns=['age_group'])   # drop the original categorical version

# 6. Train/test split:
X = df.drop('median_house_value', axis=1)
y = df['median_house_value']

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

# Columns to scale
scale_cols = [
    'housing_median_age',
    'median_income',
    'income_per_age'
]

# Create scaler
scaler = StandardScaler()

# Fit ONLY on training data
X_train[scale_cols] = scaler.fit_transform(
    X_train[scale_cols]
)

# Transform test data using the same scaler
X_test[scale_cols] = scaler.transform(
    X_test[scale_cols]
)


model = LinearRegression()

model.fit(X_train, y_train)

y_pred = model.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)

rmse = np.sqrt(
    mean_squared_error(y_test, y_pred)
)

r2 = r2_score(y_test, y_pred)

print("MAE :", mae)
print("RMSE:", rmse)
print("R²  :", r2)