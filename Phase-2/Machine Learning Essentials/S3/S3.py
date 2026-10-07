# 1. What Is Classification?
# Predicts a discrete category/class instead of a continuous number. Binary (spam/not spam) or multi-class (cat/dog/bird).

# 2. Logistic Regression
# Despite the name, it's a classifier. It predicts the probability an instance belongs to a class, using the sigmoid function to squash any real number into [0, 1]:
# sigmoid(z) = 1 / (1 + e^(-z)) - where z = w·x + b (same linear combination as before).
from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
model.fit(X_train, y_train)

model.predict(X_test)           # class labels (0 or 1)
model.predict_proba(X_test)     # probability for each class

# Decision rule: if probability ≥ 0.5 → class 1, else class 0 (threshold is tunable — you'll see why that matters with precision/recall).
# Cost function: Log Loss / Binary Cross-Entropy (not MSE — MSE with sigmoid creates a non-convex optimization surface). You'll meet cross-entropy again in neural networks.

# 3. Decision Trees:
# Splits data recursively based on feature thresholds that best separate classes, using metrics like Gini impurity or entropy to pick the best split at each node.
from sklearn.tree import DecisionTreeClassifier

tree = DecisionTreeClassifier(max_depth=5, random_state=42)
tree.fit(X_train, y_train)

# max_depth — limits how deep the tree grows; crucial for preventing overfitting (unconstrained trees will grow until every leaf is pure, essentially memorizing training data).
# Naturally handles non-linear relationships, no scaling needed.
# Easy to interpret (can visualize the tree), but prone to overfitting and instability (small data changes → very different tree).

# Random Forest (brief mention, since it builds on trees): trains many trees on random subsets of data/features and averages their votes — reduces overfitting/variance significantly compared to a single tree.
from sklearn.ensemble import RandomForestClassifier
rf = RandomForestClassifier(n_estimators=100, random_state=42)

# 4. K-Nearest Neighbors (KNN):
# No real "training" — it memorizes the data. For a new point, it finds the k closest points (by distance, usually Euclidean — you already know this from your vector/embeddings background) and predicts the majority class among them.
from sklearn.neighbors import KNeighborsClassifier

knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(X_train, y_train)

# Requires feature scaling — distance-based, so unscaled features distort neighbor calculations (same reasoning as Ridge/Lasso, but for a different reason: raw Euclidean distance).
# Small k → sensitive to noise (high variance). Large k → smoother boundary (higher bias).
# Slow at prediction time on large datasets (must compute distance to every training point) — this connects directly to what you already know about vector similarity search (FAISS etc. exist to solve exactly this "find nearest neighbors fast" problem at scale).

# 5. Support Vector Machines (SVM) — Overview
# Finds the hyperplane that maximizes the margin between classes — the decision boundary is placed as far as possible from the nearest points of each class (the "support vectors").

from sklearn.svm import SVC

svm = SVC(kernel='rbf', C=1.0)
svm.fit(X_train, y_train)

# kernel='linear' — straight-line boundary. kernel='rbf' — non-linear boundary via the "kernel trick" (implicitly maps data to higher dimensions without explicitly computing them).
# C — regularization-like parameter: small C = wider margin, more tolerance for misclassification (simpler boundary); large C = tries hard to classify every point correctly (risk of overfitting).
# Requires scaling. Effective in high-dimensional spaces but slower on large datasets — this is overview-level, you'll rarely need to hand-tune SVMs deeply as a beginner.

# Derived Metrics
#
# | Metric    | Formula                              | Answers                                      |
# |-----------|--------------------------------------|----------------------------------------------|
# | Accuracy  | (TP + TN) / Total                    | What % overall did we get right?             |
# | Precision | TP / (TP + FP)                       | Of predicted positives, how many were       |
# |           |                                      | actually positive?                           |
# | Recall    | TP / (TP + FN)                       | Of actual positives, how many did we catch? |
# | F1 Score  | 2 * (Precision * Recall) /           | Harmonic mean — balances both               |
# |           | (Precision + Recall)                 | precision and recall                         |
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

print(classification_report(y_test, y_pred))  # gives all of them at once

# ROC-AUC: plots True Positive Rate vs. False Positive Rate at every possible threshold. AUC (Area Under Curve) summarizes this into one number — 1.0 = perfect classifier, 0.5 = random guessing.

from sklearn.metrics import roc_auc_score
roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])  # needs probabilities, not class labels
# Useful because it's threshold-independent — tells you how well the model separates classes in general, not just at the default 0.5 cutoff.