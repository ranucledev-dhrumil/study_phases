 """
MACHINE LEARNING STUDY NOTES + PRACTICAL PYTHON
================================================

Topics covered
--------------
1. Supervised vs Unsupervised Learning
2. Mean
3. Centroid
4. Distance / Euclidean Distance
5. Clustering
6. K-Means
7. Inertia
8. Elbow Method
9. Feature Scaling / StandardScaler
10. PCA (Principal Component Analysis)
11. Regression error metrics: MAE, MSE, RMSE
12. Classification with Logistic Regression
13. Train/Test Split
14. Prediction
15. Confusion Matrix
16. Accuracy, Precision, Recall, F1 Score
17. A complete Student Success Predictor example

HOW TO RUN
-----------
Install the libraries if necessary:

    pip install numpy pandas matplotlib scikit-learn

Then run:

    python machine_learning_notes.py

This file is deliberately written as a STUDY FILE.
Most explanations and formulas are written as comments so you can
read the file like lecture notes while also running the examples.
"""

# ================================================================
# 0. IMPORTS
# ================================================================

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)


# ================================================================
# 1. SUPERVISED VS UNSUPERVISED LEARNING
# ================================================================

# SUPERVISED LEARNING
# -------------------
# We have:
#
#       X = input/features
#       y = known answer/target/label
#
# Example:
#
#       Study Hours     Attendance     Result
#            5              90          PASS
#            2              50          FAIL
#
# The model learns a relationship between X and y.
#
# Common supervised tasks:
#   - Classification: PASS / FAIL, YES / NO, SPAM / NOT SPAM
#   - Regression: predicting a number such as salary, price, score
#
#
# UNSUPERVISED LEARNING
# ---------------------
# We have X but do NOT have a target/answer.
#
# Example:
#
#       Customer     Spending     Visits
#          A           100           5
#          B           110           6
#          C           900          20
#          D           850          18
#
# We ask the model to discover structure.
#
# A common unsupervised technique is CLUSTERING.
#
# Clustering means:
#       "Put similar data points into groups."
#
# K-Means is one of the most common clustering algorithms.


# ================================================================
# 2. BASIC MATHEMATICS: MEAN
# ================================================================

# Mean = average.
#
# Formula:
#
#               x1 + x2 + ... + xn
#       mean = ---------------------
#                       n
#
# Example:
#
#       values = [10, 20, 30]
#
#       mean = (10 + 20 + 30) / 3
#            = 60 / 3
#            = 20

values = np.array([10, 20, 30])
mean_value = np.mean(values)

print("\n--- MEAN ---")
print("Values:", values)
print("Mean:", mean_value)


# ================================================================
# 3. CENTROID
# ================================================================

# A centroid is the "center" of a group of points.
#
# For 2D points:
#
#       Point 1 = (x1, y1)
#       Point 2 = (x2, y2)
#       ...
#
# The centroid is:
#
#       centroid_x = mean(all x values)
#       centroid_y = mean(all y values)
#
# Example:
#
#       A = (20, 100)
#       B = (30, 200)
#       C = (40, 300)
#
#       centroid_x = (20 + 30 + 40) / 3 = 30
#       centroid_y = (100 + 200 + 300) / 3 = 200
#
#       centroid = (30, 200)
#
# K-Means repeatedly calculates these centers.

points = np.array([
    [20, 100],
    [30, 200],
    [40, 300],
])

centroid = np.mean(points, axis=0)

print("\n--- CENTROID ---")
print("Points:\n", points)
print("Centroid:", centroid)


# ================================================================
# 4. EUCLIDEAN DISTANCE
# ================================================================

# Distance tells us how far two points are from each other.
#
# For two 2D points:
#
#       A = (x1, y1)
#       B = (x2, y2)
#
# Euclidean distance:
#
#       d = sqrt((x2 - x1)^2 + (y2 - y1)^2)
#
# Example:
#
#       A = (20, 50)
#       B = (22, 60)
#
#       d = sqrt((22 - 20)^2 + (60 - 50)^2)
#         = sqrt(2^2 + 10^2)
#         = sqrt(4 + 100)
#         = sqrt(104)
#         ≈ 10.20
#
# In K-Means, a point is assigned to the nearest centroid.

point_a = np.array([20, 50])
point_b = np.array([22, 60])

distance = np.sqrt(np.sum((point_b - point_a) ** 2))

print("\n--- EUCLIDEAN DISTANCE ---")
print("Point A:", point_a)
print("Point B:", point_b)
print("Distance:", distance)


# ================================================================
# 5. K-MEANS CLUSTERING
# ================================================================

# K-Means goal:
#
#       Divide data into K groups (clusters).
#
# Basic process:
#
#   STEP 1: Choose K
#   STEP 2: Start with initial centroids
#   STEP 3: Calculate distance from every point to every centroid
#   STEP 4: Assign each point to its nearest centroid
#   STEP 5: Recalculate each centroid using the mean
#   STEP 6: Repeat steps 3-5 until the assignments/centroids stabilize
#
# The name "K-Means" comes from:
#
#       K    = number of clusters
#       Means = cluster centers are calculated using means
#
# IMPORTANT:
# K-Means needs K to be chosen.
# The Elbow Method can help us choose a useful K.


# ------------------------------------------------
# 5A. Create a small example dataset
# ------------------------------------------------

# These points intentionally form three groups.
cluster_data = np.array([
    [1, 1], [1.5, 2], [2, 1.5], [2.5, 2],
    [8, 8], [8.5, 9], [9, 8.5], [9.5, 9],
    [15, 2], [15.5, 2.5], [16, 1.5], [16.5, 2],
])

# ------------------------------------------------
# 5B. Create and train K-Means
# ------------------------------------------------

kmeans = KMeans(
    n_clusters=3,
    random_state=42,
    n_init=10
)

cluster_labels = kmeans.fit_predict(cluster_data)

# The learned centers:
centroids = kmeans.cluster_centers_

print("\n--- K-MEANS ---")
print("Cluster labels:")
print(cluster_labels)

print("\nCentroids:")
print(centroids)

# fit_predict() does two things:
#
#       fit      -> learn the cluster structure
#       predict  -> return the cluster assigned to each point
#
# Example result could look like:
#
#       [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2]
#
# The actual numbers 0, 1, 2 are just cluster IDs.
# Cluster 0 does NOT automatically mean "best".
# Cluster 1 does NOT automatically mean "medium".
# They are simply labels assigned by the algorithm.


# ================================================================
# 6. VISUALIZE K-MEANS
# ================================================================

# A scatter plot is useful when X and Y are numeric.
#
# Each point is colored according to its cluster.
# The X and Y axes are the two features in this small example.

plt.figure()
plt.scatter(
    cluster_data[:, 0],
    cluster_data[:, 1],
    c=cluster_labels
)
plt.scatter(
    centroids[:, 0],
    centroids[:, 1],
    marker="X",
    s=200
)
plt.title("K-Means Clustering")
plt.xlabel("Feature 1")
plt.ylabel("Feature 2")
plt.show()


# ================================================================
# 7. INERTIA
# ================================================================

# Inertia is a measure of how tightly the points are grouped around
# their assigned centroids.
#
# Conceptually:
#
#       Inertia = sum of squared distances
#                 from each point to its assigned centroid
#
# A simplified mathematical expression is:
#
#       Inertia = Σ ||x_i - c_j||^2
#
# where:
#
#       x_i = a data point
#       c_j = centroid of the cluster assigned to x_i
#
# Lower inertia means the points are closer to their cluster centers.
#
# IMPORTANT:
# Inertia generally decreases when K increases.
#
# Therefore, we do NOT simply choose the K with the smallest inertia.
# If we keep increasing K, eventually every point can become its own
# cluster and inertia can become very small.
#
# Instead, we look for the "elbow" where the improvement starts
# becoming much smaller.


print("\n--- INERTIA ---")
print("K-Means inertia for K=3:", kmeans.inertia_)


# ================================================================
# 8. ELBOW METHOD
# ================================================================

# The Elbow Method:
#
#   1. Try several values of K.
#   2. Train K-Means for each K.
#   3. Record inertia.
#   4. Plot K against inertia.
#   5. Look for the point where the curve bends like an elbow.
#
# Example:
#
#       K       Inertia
#       1       very high
#       2       much lower
#       3       much lower
#       4       slightly lower
#       5       slightly lower
#
# If the big improvement happens until K=3 and after that the curve
# flattens, K=3 may be a reasonable choice.

inertias = []
k_values = range(1, 9)

for k in k_values:
    model = KMeans(
        n_clusters=k,
        random_state=42,
        n_init=10
    )
    model.fit(cluster_data)
    inertias.append(model.inertia_)

print("\n--- ELBOW METHOD DATA ---")
for k, inertia in zip(k_values, inertias):
    print(f"K={k}, inertia={inertia:.2f}")

plt.figure()
plt.plot(list(k_values), inertias, marker="o")
plt.title("Elbow Method")
plt.xlabel("Number of Clusters (K)")
plt.ylabel("Inertia")
plt.show()

# IMPORTANT:
# The elbow is a judgment/heuristic.
# It is not a magical mathematical command that always returns one
# universally correct K.


# ================================================================
# 9. FEATURE SCALING
# ================================================================

# Why scaling?
#
# Suppose we have:
#
#       Study Hours = 0 to 10
#       Attendance  = 0 to 100
#       Income      = 10,000 to 100,000
#
# The numerical ranges are very different.
#
# Many ML algorithms are sensitive to feature scale.
#
# StandardScaler transforms a feature approximately using:
#
#                 x - mean(x)
#       z = -------------------------
#              standard deviation
#
# After standardization, a feature is approximately:
#
#       mean = 0
#       standard deviation = 1
#
# IMPORTANT:
# fit_transform() learns the scaling parameters from the data and
# transforms that data.
#
# For train/test ML workflows:
#
#       scaler.fit(X_train)
#       X_train_scaled = scaler.transform(X_train)
#       X_test_scaled  = scaler.transform(X_test)
#
# Do NOT fit the scaler separately on test data.

student_features = pd.DataFrame({
    "study_hours": [2, 4, 6, 8, 10],
    "attendance": [50, 60, 75, 85, 95],
    "sleep_hours": [8, 7, 7, 6, 6],
})

scaler = StandardScaler()

scaled_student_features = scaler.fit_transform(student_features)

print("\n--- FEATURE SCALING ---")
print("Original data:")
print(student_features)

print("\nScaled data:")
print(scaled_student_features)


# ================================================================
# 10. PCA — PRINCIPAL COMPONENT ANALYSIS
# ================================================================

# PCA is used for dimensionality reduction.
#
# Problem:
#     A dataset may have many features:
#
#       Age
#       Income
#       Study Hours
#       Attendance
#       Sleep
#       Previous Score
#       ...
#
#     It is difficult to visualize 10, 20 or 100 dimensions.
#
# PCA creates new axes called principal components.
#
# Example:
#
#       10 original features
#              |
#             PCA
#              |
#              v
#       PC1 + PC2
#
# We can then plot PC1 vs PC2.
#
# IMPORTANT:
# PCA does not simply "delete columns".
# It creates new combinations/directions from the original features.
#
# The first principal component captures the largest possible amount
# of variance, the second captures the largest remaining variance
# subject to being orthogonal to the first, and so on.
#
# Because PCA is affected by scale, scaling before PCA is usually
# important when features have different units/ranges.

pca = PCA(n_components=2)

pca_result = pca.fit_transform(scaled_student_features)

print("\n--- PCA ---")
print("PCA result:")
print(pca_result)

print("\nExplained variance ratio:")
print(pca.explained_variance_ratio_)

# Explained variance ratio tells us how much of the variance is
# represented by each principal component.
#
# Example:
#       [0.70, 0.20]
#
# would mean:
#       PC1 ≈ 70%
#       PC2 ≈ 20%
#
# Combined:
#       ≈ 90% of the variance represented by the two components.

plt.figure()
plt.scatter(pca_result[:, 0], pca_result[:, 1])
plt.title("PCA: 2-Dimensional Representation")
plt.xlabel("Principal Component 1")
plt.ylabel("Principal Component 2")
plt.show()


# ================================================================
# 11. REGRESSION ERROR METRICS
# ================================================================

# These metrics are for numerical prediction problems (REGRESSION).
#
# Example:
#
#       Actual scores:
#           [90, 60, 80, 100]
#
#       Predicted scores:
#           [85, 70, 70, 95]
#
# Error:
#
#       Actual - Predicted
#
#       [-5, -10, 10, 5]
#
# The exact sign depends on which subtraction order you use.
# MAE uses absolute values, so the sign disappears.
#
#
# ------------------------------------------------
# MAE — Mean Absolute Error
# ------------------------------------------------
#
# Formula:
#
#                 Σ |actual - predicted|
#       MAE = -----------------------------
#                          n
#
# It tells us the average absolute size of the error.
#
# "On average, how far is the prediction from the actual value?"
#
#
# ------------------------------------------------
# MSE — Mean Squared Error
# ------------------------------------------------
#
# Formula:
#
#                 Σ (actual - predicted)^2
#       MSE = -----------------------------
#                           n
#
# Errors are squared.
# Large errors therefore receive more weight.
#
#
# ------------------------------------------------
# RMSE — Root Mean Squared Error
# ------------------------------------------------
#
# Formula:
#
#       RMSE = sqrt(MSE)
#
# RMSE is in the same units as the original target.
#
# Example:
#
# Actual:      [90, 60, 80, 100]
# Predicted:   [85, 70, 70, 95]
#
# Absolute errors:
#       [5, 10, 10, 5]
#
# MAE:
#       (5 + 10 + 10 + 5) / 4
#       = 30 / 4
#       = 7.5
#
# Squared errors:
#       [25, 100, 100, 25]
#
# MSE:
#       (25 + 100 + 100 + 25) / 4
#       = 250 / 4
#       = 62.5
#
# RMSE:
#       sqrt(62.5)
#       ≈ 7.91

actual_scores = np.array([90, 60, 80, 100])
predicted_scores = np.array([85, 70, 70, 95])

mae = mean_absolute_error(actual_scores, predicted_scores)
mse = mean_squared_error(actual_scores, predicted_scores)
rmse = np.sqrt(mse)

print("\n--- REGRESSION METRICS ---")
print("Actual:", actual_scores)
print("Predicted:", predicted_scores)
print("MAE:", mae)
print("MSE:", mse)
print("RMSE:", rmse)

# MEMORY TRICK:
#
#       MAE  = Difference -> Absolute -> Average
#       MSE  = Difference -> Square   -> Average
#       RMSE = Square root of MSE
#
# These are normally used for REGRESSION, not binary PASS/FAIL
# classification.


# ================================================================
# 12. CLASSIFICATION: STUDENT SUCCESS PREDICTOR
# ================================================================

# Now we switch from regression to CLASSIFICATION.
#
# Goal:
#
#       Predict whether a student will PASS or FAIL.
#
# Target:
#
#       0 = FAIL
#       1 = PASS
#
# This is a binary classification problem.
#
# The video uses Logistic Regression for this type of task.
#
# NOTE:
# Logistic Regression is a classification algorithm despite having
# "Regression" in its name.


# ------------------------------------------------
# 12A. Create an educational student dataset
# ------------------------------------------------

# This is a small self-contained example so the file can run without
# needing the video's external dataset.
#
# Features:
#   study_hours
#   attendance
#   sleep_hours
#   previous_score
#   internet_access
#
# Target:
#   passed (0 = FAIL, 1 = PASS)

student_data = pd.DataFrame({
    "study_hours": [
        1, 2, 2, 3, 3, 4, 4, 5, 5, 6,
        6, 7, 7, 8, 8, 9, 9, 10, 10, 11
    ],
    "attendance": [
        45, 50, 55, 58, 60, 62, 65, 68, 70, 72,
        75, 78, 80, 82, 85, 87, 90, 92, 94, 96
    ],
    "sleep_hours": [
        5, 6, 5, 6, 6, 7, 5, 7, 6, 7,
        6, 7, 7, 8, 7, 8, 7, 8, 8, 8
    ],
    "previous_score": [
        35, 40, 42, 45, 48, 50, 55, 58, 60, 62,
        65, 68, 70, 72, 75, 78, 82, 85, 88, 92
    ],
    "internet_access": [
        "No", "No", "Yes", "No", "Yes",
        "Yes", "No", "Yes", "Yes", "Yes",
        "No", "Yes", "Yes", "Yes", "Yes",
        "Yes", "Yes", "Yes", "Yes", "Yes"
    ],
    "passed": [
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 1,
        1, 1, 1, 1, 1,
        1, 1, 1, 1, 1
    ]
})

print("\n--- STUDENT DATA ---")
print(student_data)


# ================================================================
# 13. CATEGORICAL DATA -> NUMBERS
# ================================================================

# Machine-learning algorithms work with numerical representations.
#
# Example:
#
#       Yes -> 1
#       No  -> 0
#
# We can use pandas mapping here.
#
# In a larger project, the choice of encoder depends on the type of
# categorical variable. Do not blindly map every category to numbers
# because the numerical order can create unintended meaning.

student_data["internet_access"] = student_data["internet_access"].map({
    "No": 0,
    "Yes": 1
})

print("\n--- AFTER CATEGORICAL ENCODING ---")
print(student_data)


# ================================================================
# 14. X AND y
# ================================================================

# X = input features
# y = target/output
#
# Here:
#
#       X = study hours, attendance, sleep, previous score,
#           internet access
#
#       y = passed
#
# This is one of the most important conventions in ML code.

X = student_data.drop(columns=["passed"])
y = student_data["passed"]

print("\n--- X AND y ---")
print("X:")
print(X)

print("\ny:")
print(y)


# ================================================================
# 15. TRAIN / TEST SPLIT
# ================================================================

# We should not train and evaluate on exactly the same observations.
#
# We split the data into:
#
#       Training data -> model learns from this
#       Testing data  -> model is evaluated on unseen data
#
# Example:
#
#       80% train
#       20% test
#
# random_state makes the split reproducible.
#
# stratify=y helps preserve the class proportions in a classification
# dataset when possible.

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\n--- TRAIN / TEST SPLIT ---")
print("Training rows:", len(X_train))
print("Testing rows:", len(X_test))


# ================================================================
# 16. SCALE THE FEATURES CORRECTLY
# ================================================================

# IMPORTANT ML RULE:
#
#       FIT scaler on TRAINING data only.
#
# Then use the already-fitted scaler to transform both train and test.
#
# Correct:
#
#       scaler.fit(X_train)
#       X_train_scaled = scaler.transform(X_train)
#       X_test_scaled = scaler.transform(X_test)
#
# Why?
# Because the test set should represent unseen data.
# Using test-set statistics during training can cause data leakage.

model_scaler = StandardScaler()

X_train_scaled = model_scaler.fit_transform(X_train)
X_test_scaled = model_scaler.transform(X_test)


# ================================================================
# 17. LOGISTIC REGRESSION
# ================================================================

# Logistic Regression is commonly used for classification.
#
# For binary classification, the model estimates a probability of
# belonging to a class.
#
# Conceptually:
#
#       Linear combination:
#
#       z = b0 + b1*x1 + b2*x2 + ... + bn*xn
#
# Then the sigmoid function converts z to a value between 0 and 1:
#
#                     1
#       sigmoid(z) = -------
#                    1 + e^(-z)
#
# That value can be interpreted as a probability for the positive class.
#
# A classification threshold is then used to produce a class label.
# A common default threshold is 0.5, although thresholds can be
# changed depending on the application.
#
# We do not manually calculate these values here; scikit-learn does it.

logistic_model = LogisticRegression(random_state=42)

logistic_model.fit(X_train_scaled, y_train)


# ================================================================
# 18. MAKE PREDICTIONS
# ================================================================

# model.predict() returns class labels:
#
#       0 -> FAIL
#       1 -> PASS

y_pred = logistic_model.predict(X_test_scaled)

# model.predict_proba() returns probabilities for each class.
#
# For binary classification:
#
#       column 0 -> probability of class 0
#       column 1 -> probability of class 1

y_probabilities = logistic_model.predict_proba(X_test_scaled)

print("\n--- PREDICTIONS ---")
print("Actual:", y_test.to_numpy())
print("Predicted:", y_pred)
print("\nProbabilities:")
print(y_probabilities)


# ================================================================
# 19. CLASSIFICATION METRICS
# ================================================================

# ------------------------------------------------
# Accuracy
# ------------------------------------------------
#
# Formula:
#
#                  TP + TN
#       Accuracy = ---------
#                  TP+TN+FP+FN
#
# It is the fraction of all predictions that were correct.
#
# IMPORTANT:
# Accuracy can be misleading when classes are highly imbalanced.
#
#
# ------------------------------------------------
# Precision
# ------------------------------------------------
#
# Formula:
#
#                   TP
#       Precision = ------
#                  TP + FP
#
# Question:
#
#       "Of everything the model predicted as POSITIVE,
#        how much was actually positive?"
#
#
# ------------------------------------------------
# Recall
# ------------------------------------------------
#
# Formula:
#
#                   TP
#       Recall = -----------
#                TP + FN
#
# Question:
#
#       "Of all the actual positive cases,
#        how many did the model find?"
#
#
# ------------------------------------------------
# F1 Score
# ------------------------------------------------
#
# Formula:
#
#                   2 * Precision * Recall
#       F1 = --------------------------------
#                    Precision + Recall
#
# F1 balances precision and recall.
#
#
# For this student example, "positive" is class 1 = PASS.
#
# In other applications, you may decide that class 0 is the important
# class. Always interpret the metric in context.

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)

print("\n--- CLASSIFICATION METRICS ---")
print("Accuracy :", accuracy)
print("Precision:", precision)
print("Recall   :", recall)
print("F1 Score :", f1)


# ================================================================
# 20. CONFUSION MATRIX
# ================================================================

# Confusion matrix for binary classification:
#
#                         PREDICTED
#                       0          1
#
# ACTUAL 0             TN         FP
# ACTUAL 1             FN         TP
#
# TN = True Negative
#     Actual 0, predicted 0
#
# FP = False Positive
#     Actual 0, predicted 1
#
# FN = False Negative
#     Actual 1, predicted 0
#
# TP = True Positive
#     Actual 1, predicted 1
#
# The matrix helps us understand not only "how accurate" the model
# is, but WHAT TYPE of mistakes it makes.

cm = confusion_matrix(y_test, y_pred)

print("\n--- CONFUSION MATRIX ---")
print(cm)

print("\nClassification report:")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=["FAIL", "PASS"],
        zero_division=0
    )
)

plt.figure()
plt.imshow(cm)
plt.title("Confusion Matrix")
plt.xlabel("Predicted Label")
plt.ylabel("Actual Label")
plt.xticks([0, 1], ["FAIL", "PASS"])
plt.yticks([0, 1], ["FAIL", "PASS"])

for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):
        plt.text(j, i, cm[i, j], ha="center", va="center")

plt.colorbar()
plt.show()


# ================================================================
# 21. MAKE A PREDICTION FOR A NEW STUDENT
# ================================================================

# Suppose a new student enters:
#
#       study_hours     = 5
#       attendance      = 80
#       sleep_hours     = 7
#       previous_score  = 65
#       internet        = Yes -> 1
#
# IMPORTANT:
# The new student's columns must be in EXACTLY the same order as the
# training features.

new_student = pd.DataFrame({
    "study_hours": [5],
    "attendance": [80],
    "sleep_hours": [7],
    "previous_score": [65],
    "internet_access": [1]
})

# Use the SAME scaler that was fitted on X_train.
new_student_scaled = model_scaler.transform(new_student)

new_prediction = logistic_model.predict(new_student_scaled)[0]
new_probability = logistic_model.predict_proba(new_student_scaled)[0, 1]

print("\n--- NEW STUDENT PREDICTION ---")
print("Input:")
print(new_student)

print("\nPredicted class:", new_prediction)
print("Probability of PASS:", new_probability)

if new_prediction == 1:
    print("Result: PASS")
else:
    print("Result: FAIL")


# ================================================================
# 22. COMPLETE ML WORKFLOW — THE BIG PICTURE
# ================================================================

# When building a supervised ML project, remember this sequence:
#
#       1. Collect data
#              ↓
#       2. Understand/explore data
#              ↓
#       3. Clean/preprocess data
#              ↓
#       4. Convert categorical values when appropriate
#              ↓
#       5. Separate X and y
#              ↓
#       6. Split train/test
#              ↓
#       7. Fit preprocessing on TRAINING data
#              ↓
#       8. Transform train and test
#              ↓
#       9. Train model
#              ↓
#      10. Predict
#              ↓
#      11. Evaluate
#              ↓
#      12. Use model for new data
#
#
# For the Student Success project:
#
#       Student data
#            ↓
#       X = student features
#       y = PASS/FAIL
#            ↓
#       train_test_split()
#            ↓
#       StandardScaler
#            ↓
#       LogisticRegression
#            ↓
#       model.fit()
#            ↓
#       model.predict()
#            ↓
#       confusion_matrix
#       accuracy
#       precision
#       recall
#       F1
#            ↓
#       PASS / FAIL for new student


# ================================================================
# 23. WHICH PLOT SHOULD I USE?
# ================================================================

# A useful 3-step rule from the study material:
#
# 1. Are X and Y numeric?
#       -> Scatter Plot
#       -> Useful for relationships between numeric variables
#
# 2. Is one column a category?
#       -> Bar Plot / Count Plot
#       -> Useful for comparing categories/counts
#
# 3. Want to see a distribution shape?
#       -> Histogram / KDE Plot / Box Plot
#
#
# Quick mental guide:
#
#       Numeric vs Numeric
#             -> Scatter
#
#       Category vs Count
#             -> Bar / Count
#
#       Distribution
#             -> Histogram / KDE / Box
#
#       Clustering
#             -> Scatter plot (when dimensions allow)
#
#       PCA
#             -> Scatter plot of PC1 vs PC2
#
#       Classification mistakes
#             -> Confusion Matrix / Heatmap


# ================================================================
# 24. INTERVIEW / EXAM QUICK NOTES
# ================================================================

# Q: What is supervised learning?
# A: Learning from labeled data where the target/answer is known.
#
# Q: What is unsupervised learning?
# A: Finding patterns or structure in data without a target label.
#
# Q: What is clustering?
# A: Grouping similar observations together.
#
# Q: What is K-Means?
# A: An unsupervised clustering algorithm that assigns observations
#    to K clusters based on distance to cluster centroids.
#
# Q: What is K?
# A: The number of clusters we want.
#
# Q: What is a centroid?
# A: The center of a cluster, calculated using the mean of the
#    observations assigned to that cluster.
#
# Q: What is Euclidean distance?
# A: A geometric distance measure:
#
#       sqrt(sum((x_i - y_i)^2))
#
# Q: What is inertia?
# A: The sum of squared distances between observations and their
#    assigned cluster centers.
#
# Q: Why use the Elbow Method?
# A: To help select a useful number of clusters by examining how
#    inertia decreases as K increases.
#
# Q: What is feature scaling?
# A: Transforming features to comparable scales.
#
# Q: What does StandardScaler do?
# A: Standardizes features approximately to mean 0 and standard
#    deviation 1.
#
# Q: What is PCA?
# A: A dimensionality-reduction technique that creates principal
#    components capturing directions of variation in the data.
#
# Q: What is Logistic Regression used for here?
# A: Binary classification such as PASS vs FAIL.
#
# Q: What is MAE?
# A: Average absolute prediction error.
#
# Q: What is MSE?
# A: Average squared prediction error.
#
# Q: What is RMSE?
# A: Square root of MSE.
#
# Q: What is precision?
# A: Of predicted positives, the fraction that are actually positive.
#
# Q: What is recall?
# A: Of actual positives, the fraction correctly identified.
#
# Q: What is F1?
# A: Harmonic mean of precision and recall.
#
# Q: What is a confusion matrix?
# A: A table showing correct and incorrect classification predictions
#    by actual and predicted class.


# ================================================================
# 25. VERY IMPORTANT: REGRESSION VS CLASSIFICATION
# ================================================================

# REGRESSION
# ----------
# Target is a NUMBER.
#
# Example:
#
#       Predict exam score:
#       87.5
#
# Metrics:
#
#       MAE
#       MSE
#       RMSE
#
#
# CLASSIFICATION
# --------------
# Target is a CLASS/LABEL.
#
# Example:
#
#       PASS
#       FAIL
#
# Metrics:
#
#       Accuracy
#       Precision
#       Recall
#       F1
#       Confusion Matrix
#
#
# MEMORY TRICK:
#
#       "Predicting a NUMBER?"
#           -> Think regression
#           -> MAE / MSE / RMSE
#
#       "Predicting a CATEGORY?"
#           -> Think classification
#           -> Accuracy / Precision / Recall / F1


# ================================================================
# 26. FINAL SUMMARY
# ================================================================

# The most important chain to remember from these notes:
#
#       UNSUPERVISED
#           ↓
#       CLUSTERING
#           ↓
#       K-MEANS
#           ↓
#       DISTANCE
#           ↓
#       CENTROIDS
#           ↓
#       INERTIA
#           ↓
#       ELBOW METHOD
#           ↓
#       CHOOSE K
#
# And for high-dimensional data:
#
#       MANY FEATURES
#           ↓
#       SCALE
#           ↓
#       PCA
#           ↓
#       FEWER DIMENSIONS
#           ↓
#       VISUALIZE
#
# And for the Student Success Predictor:
#
#       RAW STUDENT DATA
#           ↓
#       PREPROCESS
#           ↓
#       CATEGORICAL -> NUMERIC
#           ↓
#       X / y
#           ↓
#       TRAIN / TEST SPLIT
#           ↓
#       SCALE
#           ↓
#       LOGISTIC REGRESSION
#           ↓
#       PREDICT
#           ↓
#       CONFUSION MATRIX
#           ↓
#       PRECISION / RECALL / F1
#           ↓
#       PASS / FAIL
#
# If you understand this flow, you understand the core structure of
# the material covered in the video.


print("\n================================================")
print("END OF MACHINE LEARNING STUDY NOTES")
print("================================================")