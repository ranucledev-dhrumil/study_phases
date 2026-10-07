import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.metrics import f1_score, recall_score, precision_score, accuracy_score, roc_auc_score
import joblib


df = pd.read_csv("titanic.csv")

# Drop irrelevant / high-cardinality / mostly-null columns
df = df.drop(columns=["PassengerId", "Name", "Ticket", "Cabin"])

X = df.drop("Survived", axis=1)
y = df["Survived"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# --- Column groups ---
numeric_cols = ["Age", "SibSp", "Parch", "Fare", "Pclass"]
sex_col = ["Sex"]                 # binary -> ordinal/label-style encoding
embarked_col = ["Embarked"]       # nominal -> one-hot, with imputation first

# Numeric: impute missing Age with median, then scale
numeric_pipeline = Pipeline([
    ("impute", SimpleImputer(strategy="median")),
    ("scale", StandardScaler())
])

# Sex: binary category -> OrdinalEncoder (male/female -> 0/1)
sex_pipeline = Pipeline([
    ("encode", OrdinalEncoder())
])

# Embarked: impute missing with most frequent, then one-hot encode
embarked_pipeline = Pipeline([
    ("impute", SimpleImputer(strategy="most_frequent")),
    ("encode", OneHotEncoder(drop="first", handle_unknown="ignore"))
])

preprocessor = ColumnTransformer(transformers=[
    ("numeric", numeric_pipeline, numeric_cols),
    ("sex", sex_pipeline, sex_col),
    ("embarked", embarked_pipeline, embarked_col),
])

models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),

    "Decision Tree": DecisionTreeClassifier(
        random_state=42
    ),

    "KNN": KNeighborsClassifier(
        n_neighbors=5
    ),

    "SVC": SVC(
        probability=True,
        random_state=42
    ),

    "MLP": MLPClassifier(
        hidden_layer_sizes=(32, 16),
        activation="relu",
        solver="adam",
        max_iter=1000,
        random_state=42
    )
}
results = []

for model_name, model in models.items():

    pipeline = Pipeline([
        ("preprocessing", preprocessor),
        ("model", model)
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    results.append({
        "Model": model_name,
        "Accuracy": accuracy_score(y_test, y_pred),
        "Precision": precision_score(y_test, y_pred),
        "Recall": recall_score(y_test, y_pred),
        "F1": f1_score(y_test, y_pred),
        "ROC-AUC": roc_auc_score(y_test, y_prob)
    })

comparison_table = pd.DataFrame(results)

print("\nModel Comparison:")
print(comparison_table.round(4).to_string(index=False))

pipeline = Pipeline([
        ("preprocessing", preprocessor),
        ("model", model)
    ])

joblib.dump(pipeline, "full_pipeline.joblib")