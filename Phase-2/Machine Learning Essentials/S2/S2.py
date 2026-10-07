# 1. What Is Regression?

# Regression predicts a continuous numeric value (price, temperature, age) as opposed to a category.

# For a single feature: ŷ = w·x + b
# For multiple features: ŷ = w1·x1 + w2·x2 + ... + wn·xn + b

# w (weights/coefficients) — learned during training, one per feature
# b (bias/intercept) — the baseline value when all features are 0

# How it learns: minimizes a cost function, typically Mean Squared Error (MSE):

# MSE = (1/n) * Σ(y_actual - y_predicted)²

# Squaring penalizes large errors more heavily than small ones, and keeps the function differentiable (needed for optimization).

# Optimization — two ways to find the best w, b:

# Normal Equation (closed-form solution, what sklearn's LinearRegression uses under the hood) — solves directly via matrix algebra, no iteration needed. Fast for small/medium datasets, expensive for huge ones.
# Gradient Descent — iteratively adjusts weights in the direction that reduces the cost function, using a learning rate. Used when the closed-form solution is too expensive (e.g., huge feature counts) or for other models (like neural nets, later).

from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)

print(model.coef_)        # learned weights
print(model.intercept_)   # learned bias

# 3. Polynomial Regression:
# Linear regression assumes a straight-line (or hyperplane) relationship. If the true relationship is curved, you can still use LinearRegression — but on transformed features:
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline

poly_model = Pipeline([
    ('poly', PolynomialFeatures(degree=2)),
    ('linear', LinearRegression())
])
poly_model.fit(X_train, y_train)

# PolynomialFeatures(degree=2) on [x1, x2] creates [1, x1, x2, x1², x1*x2, x2²] — the model is still "linear" in these new features, but the resulting curve in original feature-space is non-linear.
# Danger: higher degree = more flexible = higher risk of overfitting. Degree 2-3 is usually enough; degree 10 will fit training data almost perfectly and generalize terribly.

# 4. The Bias-Variance Tradeoff:
# High bias (underfitting) — model too simple, misses patterns in both train and test data. E.g., fitting a straight line to clearly curved data.
# High variance (overfitting) — model too complex, memorizes training noise, fails on test data. E.g., degree-15 polynomial on 50 data points.

# 5. Regularization — Ridge & Lasso:
# Regularization combats overfitting by penalizing large weights in the cost function, forcing the model to stay simpler.

# Ridge Regression (L2 penalty): Shrinks weights toward zero but rarely makes them exactly zero.
# Cost = MSE + α * Σ(wᵢ²)

from sklearn.linear_model import Ridge

ridge = Ridge(alpha=1.0)   # alpha controls regularization strength
ridge.fit(X_train, y_train)

# Lasso Regression (L1 penalty): Can shrink weights all the way to zero — effectively performing automatic feature selection (useless features get eliminated).
# Cost = MSE + α * Σ|wᵢ|
from sklearn.linear_model import Lasso

lasso = Lasso(alpha=0.1)
lasso.fit(X_train, y_train)

# When to use which:
# Ridge — when you believe most features are useful, just want to control overfitting.
# Lasso — when you suspect many features are irrelevant and want automatic feature selection.
# ElasticNet exists too — a blend of both penalties.
# alpha is a hyperparameter — higher alpha = stronger regularization = simpler model (more bias, less variance). Tuned via validation, not learned automatically.

# METRIC                  FORMULA (CONCEPT)              INTERPRETATION
# --------------------------------------------------------------------------------
# MAE                     avg(|y - ŷ|)                   Average magnitude of error,
# (Mean Absolute Error)                                  same units as target,
#                                                        robust to outliers

# MSE                     avg((y - ŷ)²)                  Penalizes large errors
# (Mean Squared Error)                                   heavily, not in original
#                                                        units

# RMSE                    √MSE                           Back in original units,
# (Root MSE)                                             still penalizes large
#                                                        errors more than MAE

# R²                      1 - (SS_res / SS_tot)          Proportion of variance
# (R-squared)                                             explained by the model.
#                                                        1.0 = perfect
#                                                        0 = as good as predicting
#                                                            the mean
#                                                        Negative = worse than
#                                                            the mean

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

# Use RMSE when large errors are especially bad (penalizes big misses more).
# Use MAE when you want a metric that's easy to explain in plain terms ("on average, we're off by $X") and don't want outliers to dominate.
# R² tells you relative performance vs. a naive baseline (predicting the mean every time) — good for a quick sanity check, but doesn't tell you the actual error magnitude in real units.