from sklearn.model_selection import train_test_split
import pandas as pd

# X = inputs/features
# For our Data housing.csv:
# longitude
# latitude
# housing_median_age
# total_rooms
# total_bedrooms
# population
# households
# median_income
# ocean_proximity


# y = output/target:
# For our Data housing.csv: median_house_value


# So,        X ────────────────→ ML Model ───────────────→ y
#        (House information)                          (House price)

df = pd.read_csv("housing.csv")

X = df.drop('median_house_value', axis=1)
# Take the entire dataframe, but remove the median_house_value column - which is to be predicted

y = df['median_house_value']
# Give me only the median_house_value column - to be predicted

# print("X Head:")
# print(X.head())
# print("\n")
# print("y Head:")
# print(y.head())


X_train, X_test, y_train, y_test = train_test_split(
    X, 
    y, 
    test_size=0.2,
    random_state=42
)

print("X train: ")
print(X_train)
print("X test: ")
print(X_test)
print("y train: ")
print(y_train)
print("y test: ")
print(y_test)