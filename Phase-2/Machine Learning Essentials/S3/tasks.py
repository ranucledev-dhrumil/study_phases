import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.metrics import confusion_matrix, classification_report, f1_score, recall_score, precision_score, accuracy_score, roc_auc_score

df = pd.read_csv("titanic.csv")

# print(df.head())

# df = df[["Survived", "Pclass", "Sex", "Age", "SibSp", "Parch", "Fare", "Embarked"]]
df = df.drop(columns=["PassengerId", "Name", "Ticket", "Cabin"])
# print(df.head())
df["Age"] = df["Age"].fillna(df["Age"].mean())
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])

# print(df.isnull().sum())

le = LabelEncoder()
df["Sex"] = le.fit_transform(df["Sex"])

df = pd.get_dummies(df, columns=["Embarked"], dtype=int)

# Our target variable is "Survived" Column
X = df.drop("Survived", axis=1)
y = df["Survived"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y, 
    test_size=0.2,
    random_state=42,
    stratify=y
)

result = []

# Scaling for KNN and SVC
standard_scaler = StandardScaler()
X_train_scaled = standard_scaler.fit_transform(X_train)
X_test_scaled = standard_scaler.transform(X_test)

# Logistic Regression
model_log_reg = LogisticRegression()
model_log_reg.fit(X_train, y_train)
y_log_reg_pred = model_log_reg.predict(X_test)
y_log_reg_prob = model_log_reg.predict_proba(X_test)[:, 1]
print(confusion_matrix(y_test, y_log_reg_pred))
print(classification_report(y_test, y_log_reg_pred))

result.append({
    "Model": "Logistic Regression",
    "Accuracy": accuracy_score(y_test, y_log_reg_pred),
    "Precision": precision_score(y_test, y_log_reg_pred),
    "Recall": recall_score(y_test, y_log_reg_pred),
    "F1": f1_score(y_test, y_log_reg_pred),
    "ROC-AUC": roc_auc_score(y_test, y_log_reg_prob)
})

# Decision Tree
model_dec_tree = DecisionTreeClassifier(max_depth=5, random_state=42)
model_dec_tree.fit(X_train, y_train)
y_dec_tree_pred = model_dec_tree.predict(X_test)
y_dec_tree_prob = model_dec_tree.predict_proba(X_test)[:, 1]
print(confusion_matrix(y_test, y_dec_tree_pred))
print(classification_report(y_test, y_dec_tree_pred))

result.append({
    "Model": "Decision Tree",
    "Accuracy": accuracy_score(y_test, y_dec_tree_pred),
    "Precision": precision_score(y_test, y_dec_tree_pred),
    "Recall": recall_score(y_test, y_dec_tree_pred),
    "F1": f1_score(y_test, y_dec_tree_pred),
    "ROC-AUC": roc_auc_score(y_test, y_dec_tree_prob)
})


# KNN
model_knn = KNeighborsClassifier(n_neighbors=5)
model_knn.fit(X_train_scaled, y_train)
y_knn_pred = model_knn.predict(X_test_scaled)
y_knn_prob = model_knn.predict_proba(X_test_scaled)[:, 1]
print(confusion_matrix(y_test, y_knn_pred))
print(classification_report(y_test, y_knn_pred))

result.append({
    "Model": "KNN",
    "Accuracy": accuracy_score(y_test, y_knn_pred),
    "Precision": precision_score(y_test, y_knn_pred),
    "Recall": recall_score(y_test, y_knn_pred),
    "F1": f1_score(y_test, y_knn_pred),
    "ROC-AUC": roc_auc_score(y_test, y_knn_prob)
})

# SVC
model_svc = SVC(kernel='rbf', probability=True)
model_svc.fit(X_train_scaled, y_train)
y_svc_pred = model_svc.predict(X_test_scaled)
y_svc_prob = model_svc.predict_proba(X_test_scaled)[:, 1]
print(confusion_matrix(y_test, y_svc_pred))
print(classification_report(y_test, y_svc_pred))

result.append({
    "Model": "SVC",
    "Accuracy": accuracy_score(y_test, y_svc_pred),
    "Precision": precision_score(y_test, y_svc_pred),
    "Recall": recall_score(y_test, y_svc_pred),
    "F1": f1_score(y_test, y_svc_pred),
    "ROC-AUC": roc_auc_score(y_test, y_svc_prob)
})

print(pd.DataFrame(result))

best_model = model_knn

probs = best_model.predict_proba(X_test_scaled)[:, 1]

for threshold in [0.3, 0.7]:
    preds_thresh = (probs >= threshold).astype(int)

    print(f"\nThreshold = {threshold}")
    print("Precision:", precision_score(y_test, preds_thresh))
    print("Recall:", recall_score(y_test, preds_thresh))

# the best performing model overall is svc because look at the metrics:
#                  Model  Accuracy  Precision    Recall        F1   ROC-AUC
# 0  Logistic Regression  0.793296   0.766667  0.666667  0.713178  0.848880
# 1        Decision Tree  0.776536   0.754386  0.623188  0.682540  0.792688
# 2                  KNN  0.821229   0.803279  0.710145  0.753846  0.847892
# 3                  SVC  0.815642   0.860000  0.623188  0.722689  0.847036
# the overall winner is knn, althought svc has higher precision, but its recall values is less, which makes the surviving people look like they didnt survive, which doesnt help in actual prediction
# and yes proper scaling of features is required for both knn and svc both