# 1. The ML Workflow
# ┌─────────────────────────────┐
# │      Problem Framing        │
# └──────────────┬──────────────┘
#                ↓
# ┌─────────────────────────────┐
# │       Data Collection       │
# └──────────────┬──────────────┘
#                ↓
# ┌─────────────────────────────┐
# │             EDA             │
# │  Exploratory Data Analysis  │
# └──────────────┬──────────────┘
#                ↓
# ┌─────────────────────────────┐
# │      Data Cleaning / Prep   │
# └──────────────┬──────────────┘
#                ↓
# ┌─────────────────────────────┐
# │     Feature Engineering     │
# └──────────────┬──────────────┘
#                ↓
# ┌─────────────────────────────┐
# │      Train / Test Split     │
# └──────────────┬──────────────┘
#                ↓
# ┌─────────────────────────────┐
# │       Model Selection       │
# └──────────────┬──────────────┘
#                ↓
# ┌─────────────────────────────┐
# │          Training           │
# └──────────────┬──────────────┘
#                ↓
# ┌─────────────────────────────┐
# │         Evaluation          │
# └──────────────┬──────────────┘
#                ↓
# ┌─────────────────────────────┐
# │           Tuning            │
# └──────────────┬──────────────┘
#                ↓
# ┌─────────────────────────────┐
# │      Deployment / Saving    │
# └─────────────────────────────┘

# Key idea: you never evaluate a model on data it was trained on. That's the whole reason for train/test splits — to estimate how the model performs on unseen data (generalization).

# Overfitting: model memorizes training data, performs poorly on new data (low train error, high test error).
# Underfitting: model is too simple, performs poorly everywhere.


# 1. Problem Framing - Before any code, define:
# What are you predicting? — is it a number (regression) or a category (classification) or a grouping (unsupervised)? This decision shapes everything downstream.
# What's the unit of prediction? — per customer? per transaction? per day?
# What defines success? — a business metric (e.g., "reduce churn by 10%") translated into an ML metric (e.g., recall on churn class).
# Is ML even the right tool? — sometimes a simple rule-based system solves it; ML is for problems too complex for hand-written rules but with enough data to learn patterns from.
# What's the baseline? — a naive benchmark (e.g., "always predict the majority class" or "predict the mean") — your model must beat this to be worth anything.


# 2. Data Collection:
# Sources: databases/SQL, APIs, web scraping, public datasets (Kaggle, UCI), logs, sensors, third-party vendors.
# Key considerations:
# Relevance — does the data actually relate to what you're predicting?
# Volume — enough samples to learn patterns (varies wildly by problem complexity).
# Label availability — for supervised learning, do you have ground-truth labels, or do they need to be collected/annotated separately?
# Bias — does the collection method systematically over/under-represent certain groups or scenarios? (e.g., survey data collected only from one region)
# Legal/ethical — privacy, consent, licensing of the data source.

# 3. Exploratory Data Analysis (EDA): Before touching a model, understand your data. Goals: check distributions, spot outliers, find correlations, catch data quality issues.
df = []
df.info()               # dtypes, null counts
df.describe()            # mean, std, quartiles, min/max
df.isnull().sum()        # missing values per column
df['col'].value_counts() # category frequencies

import matplotlib.pyplot as plt
import seaborn as sns

df['col'].hist(bins=30)                    # distribution shape
sns.boxplot(x=df['col'])                   # visualize outliers/spread
sns.heatmap(df.corr(), annot=True)         # correlation between numeric features
sns.pairplot(df, hue='target')             # pairwise relationships

# Skewed distributions → may need log transform
# High correlation between features → multicollinearity (matters for linear models)
# Correlation with target → which features are actually useful
# Class imbalance (for classification) → visible via value_counts()
# Outlier Handling:
# Detection methods:
# IQR method
Q1 = df['col'].quantile(0.25)
Q3 = df['col'].quantile(0.75)
IQR = Q3 - Q1
lower, upper = Q1 - 1.5*IQR, Q3 + 1.5*IQR
outliers = df[(df['col'] < lower) | (df['col'] > upper)]

# Z-score method
from scipy import stats
z_scores = stats.zscore(df['col'])
outliers = df[abs(z_scores) > 3]
# Handling strategies:
# Remove — safe if outliers are clearly data errors and few in number.
# Cap/clip (winsorizing) — clamp values to the lower/upper bound instead of dropping rows:
df['col'] = df['col'].clip(lower, upper)
# Transform — log/sqrt transform to reduce the influence of extreme values.
# Leave alone — if the model is tree-based (robust to outliers) and the outliers are genuine, not errors.
# There's no universal rule — it depends on whether the outlier is a data error or a real (rare) observation, and whether your model type is sensitive to it (linear/distance-based models: sensitive; tree-based: mostly robust).




# 4. Data Preparation:
# Handling missing values:
from sklearn.impute import SimpleImputer
imputer = SimpleImputer(strategy='mean')  # or 'median', 'most_frequent', 'constant'
X_filled = imputer.fit_transform(X)

# Feature Scaling: Many algorithms (KNN, SVM, gradient descent-based models, neural nets) are sensitive to feature scale. Tree-based models (Decision Trees, Random Forest) are NOT.
from sklearn.preprocessing import StandardScaler, MinMaxScaler
scaler = StandardScaler()      # mean=0, std=1 (z-score)
X_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)   # note: transform only, not fit_transform!
minmax = MinMaxScaler()        # scales to [0,1]
# Critical rule: fit (learn mean/std) only on training data. transform test data using those same learned parameters. Fitting on test data leaks information — this is called data leakage.

# Encoding categorical variables
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
# One-hot for nominal categories (no order): e.g. city names
ohe = OneHotEncoder(sparse_output=False)
X_encoded = ohe.fit_transform(X[['city']])
# Label encoding for ordinal categories (has order): e.g. low/medium/high
le = LabelEncoder()
y_encoded = le.fit_transform(y)



# 5. Feature Engineering:
# Creating new features or transforming existing ones to help the model learn better patterns.
# Binning continuous → categorical
df['age_group'] = pd.cut(df['age'], bins=[0,18,35,60,100], labels=['teen','young','mid','senior'])
# Polynomial features (interaction terms)
from sklearn.preprocessing import PolynomialFeatures
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(X)   # adds x1^2, x2^2, x1*x2, etc.
# Date/time extraction
df['year'] = df['date'].dt.year
df['month'] = df['date'].dt.month
df['day_of_week'] = df['date'].dt.dayofweek
# Ratio/combined features (domain-driven)
df['price_per_sqft'] = df['price'] / df['area']
# Log transform for skewed features
df['log_income'] = np.log1p(df['income'])   # log1p handles zeros safely
# Feature selection (reducing dimensionality by picking useful features, not creating new ones):
from sklearn.feature_selection import SelectKBest, f_classif
selector = SelectKBest(score_func=f_classif, k=5)
X_selected = selector.fit_transform(X, y)
# Rule of thumb: good feature engineering often beats a fancier model. This is where domain knowledge matters most — it's part art, part science.

# 6.Train/Test Split:
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
# test_size=0.2 → 20% held out for testing.
# random_state → seed for reproducibility (same split every run).
# For classification with imbalanced classes, use stratify=y to preserve class proportions in both splits.

# There's also a three-way split in real projects: train / validation / test — validation is used for tuning hyperparameters, test is touched only once at the end.

# The scikit-learn Estimator API
# Every scikit-learn model/transformer follows the same consistent interface — this is the single biggest reason sklearn is easy to learn once you get the pattern:
# +------------------+----------------------------------+----------------------------------+
# | Method           | Used By                          | Purpose                          |
# +------------------+----------------------------------+----------------------------------+
# | fit(X, y)        | Estimators (models)              | Learn from training data         |
# | predict(X)       | Estimators                       | Make predictions                 |
# | fit_transform(X) | Transformers (scalers, encoders) | Learn params + transform         |
# | transform(X)     | Transformers                     | Apply learned params             |
# | score(X, y)      | Estimators                       | Quick evaluation metric          |
# +------------------+----------------------------------+----------------------------------+
from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)
accuracy = model.score(X_test, y_test)

# Pipelines
# Chaining preprocessing + model into one object avoids leakage bugs and keeps code clean:
from sklearn.pipeline import Pipeline

pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('model', LogisticRegression())
])

pipe.fit(X_train, y_train)
pipe.predict(X_test)
# The pipeline ensures fit_transform is called on train and transform (not fit_transform) is automatically called on test — you can't accidentally leak.
# ColumnTransformer lets you apply different preprocessing to different columns (e.g., scale numeric columns, one-hot encode categorical ones) — useful for real-world mixed-type datasets.