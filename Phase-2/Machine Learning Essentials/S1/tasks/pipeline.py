import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, FunctionTransformer
from sklearn.linear_model import LinearRegression
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

df = pd.read_csv("housing.csv")

# --- Feature creation done BEFORE the pipeline ---
# Safe to do here (no leakage) because these use FIXED bins/formulas,
# not statistics learned from the data (unlike scaling/imputation/outlier bounds).
bins = [0, 10, 20, 30, 40, 50, float('inf')]
labels = ['New', 'Young', 'Middle-aged', 'Mature', 'Old', 'Very Old']
df['age_group'] = pd.cut(df['housing_median_age'], bins=bins, labels=labels, right=False)

age_order = {'New': 0, 'Young': 1, 'Middle-aged': 2, 'Mature': 3, 'Old': 4, 'Very Old': 5}
df['age_group_encoded'] = df['age_group'].map(age_order).astype(int)
df = df.drop(columns=['age_group'])

df['income_per_age'] = df['median_income'] / df['housing_median_age']

X = df.drop('median_house_value', axis=1)
y = df['median_house_value']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

# --- Custom transformer for outlier capping (IQR-based) ---
# Learns Q1/Q3 bounds via fit() on TRAIN ONLY, applies via transform() to both.
class IQRCapper(BaseEstimator, TransformerMixin):
    def __init__(self, factor=1.5):
        self.factor = factor

    def fit(self, X, y=None):
        X = pd.DataFrame(X)
        self.lower_ = {}
        self.upper_ = {}
        for col in X.columns:
            Q1 = X[col].quantile(0.25)
            Q3 = X[col].quantile(0.75)
            IQR = Q3 - Q1
            self.lower_[col] = Q1 - self.factor * IQR
            self.upper_[col] = Q3 + self.factor * IQR
        return self

    def transform(self, X):
        X = pd.DataFrame(X).copy()
        for col in X.columns:
            X[col] = X[col].clip(self.lower_[col], self.upper_[col])
        return X

# --- Column groups ---
numeric_scale_cols = ['housing_median_age', 'median_income', 'income_per_age']
outlier_cap_cols = ['median_income']          # capped, then later scaled
impute_cols = ['total_bedrooms']              # median imputation
onehot_cols = ['ocean_proximity']

passthrough_cols = [c for c in X.columns
                     if c not in numeric_scale_cols + impute_cols + onehot_cols]

# Sub-pipeline: cap outliers on median_income, THEN scale it
income_pipeline = Pipeline([
    ('cap', IQRCapper()),
    ('scale', StandardScaler())
])

# Sub-pipeline: impute total_bedrooms (median), no scaling needed unless you want it
bedrooms_pipeline = Pipeline([
    ('impute', SimpleImputer(strategy='median'))
])

# Sub-pipeline: scale the other numeric cols that don't need outlier capping
other_numeric_cols = ['housing_median_age', 'income_per_age']
other_numeric_pipeline = Pipeline([
    ('scale', StandardScaler())
])

preprocessor = ColumnTransformer(transformers=[
    ('income', income_pipeline, ['median_income']),
    ('bedrooms', bedrooms_pipeline, impute_cols),
    ('other_numeric', other_numeric_pipeline, other_numeric_cols),
    ('onehot', OneHotEncoder(drop='first', handle_unknown='ignore'), onehot_cols),
], remainder='passthrough')  # passes through longitude, latitude, total_rooms,
                              # population, households, age_group_encoded unchanged

full_pipeline = Pipeline([
    ('preprocessing', preprocessor),
    ('model', LinearRegression())
])

full_pipeline.fit(X_train, y_train)
y_pred = full_pipeline.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("MAE :", mae)
print("RMSE:", rmse)
print("R²  :", r2)