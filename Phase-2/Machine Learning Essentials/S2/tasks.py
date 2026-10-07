import pandas as pd
import numpy as np
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

df = pd.read_csv("housing.csv")

# --- FIX 1: actually define X and y ---
df = pd.get_dummies(df, columns=["ocean_proximity"], drop_first=True)
df["total_bedrooms"] = df["total_bedrooms"].fillna(df["total_bedrooms"].median())

X = df.drop("median_house_value", axis=1)
y = df["median_house_value"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- FIX 2: scale before Ridge/Lasso ---
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

def evaluate(name, y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    return {"Model": name, "MAE": mae, "RMSE": rmse, "R²": r2}

results = []

linear_model = LinearRegression()
linear_model.fit(X_train, y_train)   # unscaled fine for plain LR
linear_pred = linear_model.predict(X_test)
results.append(evaluate("Linear Regression", y_test, linear_pred))

ridge_model = Ridge(alpha=1.0)
ridge_model.fit(X_train_scaled, y_train)
ridge_pred = ridge_model.predict(X_test_scaled)
results.append(evaluate("Ridge", y_test, ridge_pred))

lasso_model = Lasso(alpha=1.0)
lasso_model.fit(X_train_scaled, y_train)
lasso_pred = lasso_model.predict(X_test_scaled)
results.append(evaluate("Lasso", y_test, lasso_pred))

poly_model = Pipeline([
    ("poly", PolynomialFeatures(degree=2)),
    ("linear", LinearRegression())
])
poly_model.fit(X_train, y_train)
poly_pred = poly_model.predict(X_test)
results.append(evaluate("Polynomial Regression", y_test, poly_pred))

results_df = pd.DataFrame(results)
print(results_df)

print("\n--- Lasso coefficients ---")
lasso_coefficients = pd.DataFrame({
    "Feature": X_train.columns,
    "Coefficient": lasso_model.coef_
}).sort_values("Coefficient", key=abs)
print(lasso_coefficients)

print("\n--- Ridge alpha tuning ---")
alphas = [0.01, 0.1, 1, 10, 100]
for a in alphas:
    m = Ridge(alpha=a)
    m.fit(X_train_scaled, y_train)
    pred = m.predict(X_test_scaled)
    print(f"alpha={a:>6}: R² = {r2_score(y_test, pred):.4f}")