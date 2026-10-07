# Classification metrics:

# TP: The model predicts positive, and it is actually positive.
# TN: The model predicts negative, and it is actually negative.
# FP: The model predicts positive, but it is actually negative.
# FN: The model predicts negative, but it is actually positive.

# Accuracy: How many predictions were correct overall?
# correct_prediction / total_prediction
# Accuracy= (TP+TN) / (TP+TN+FP+FN)

# Precision = Of everything the model predicted as positive, how many were actually positive?
# Precision = TP / (TP+FP​)

# Recall = Of all the actual positive cases, how many did the model successfully find?
# Recall = TP / (TP​+FN)

# F1 score combines precision and recall into one metric.
# F1=2× ((Precision × Recall) / (Precision + Recall))

# Accuracy: overall correctness
# Precision: avoid false positives
# Recall: avoid false negatives
# F1: balance precision and recall

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

#True answers (what actually happened)
y_true = [1, 0, 1, 1, 0, 1, 0]

#Model's predictions (what it guessed)
y_pred = [1, 0, 1, 0, 0, 1, 1]

#evaluation
print("Accuracy: ", accuracy_score(y_true, y_pred))
print("Precision: ", precision_score(y_true, y_pred))
print("Recall: ", recall_score(y_true, y_pred))
print("F1 Score: ", f1_score(y_true, y_pred))


# Confusion Matrix:
# +---------------------+--------------------+--------------------+
# |                     | Actually Positive  | Actually Negative  |
# +---------------------+--------------------+--------------------+
# | Predicted Positive  | TP - True Positive | FP - False Positive|
# +---------------------+--------------------+--------------------+
# | Predicted Negative  | FN - False Negative| TN - True Negative |
# +---------------------+--------------------+--------------------+
from sklearn.metrics import confusion_matrix

y_true = [1, 0, 1, 1, 0, 1, 0, 0, 1, 0]
y_pred = [1, 0, 1, 0, 0, 1, 1, 0, 1, 0]

cm = confusion_matrix(y_true, y_pred)

print("Confusion Matrix")
print(cm)

# Regression Metrics:
# MAE: MEAN ABSOLUTE ERROR - Difference → Absolute → Average
# 1- take the mistake difference
# 2- remove the minus sign
# 3- add
# 4- divide
# mae = (sigma |actual - predicted|) / n

# MSE: Mean Squared Error - Difference → Square → Average
# mse = (sigma (|actual - predicted|)^2 ) / n
# 1- Mistakes square them
# 2- add
# 3- divide total

# RMSE: Root Mean Squared Error - MSE → Square Root
# rmse = root(MSE)

# MAE treats errors more evenly.
# MSE gives much more importance to large errors.
# RMSE brings the result back to the same units as the original data.

from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np

#real scores
real_scores = [90, 60, 80, 100]

#model guess
predicted_scores = [85, 70, 70, 95]

mae = mean_absolute_error(real_scores, predicted_scores)

mse = mean_squared_error(real_scores, predicted_scores)

rmse = np.sqrt(mse)

print("MAE: On average off by: ", mae)
print("MSE: Squared Mistake Value: ", mse)
print("RMSE: Final Realistic error: ", rmse)