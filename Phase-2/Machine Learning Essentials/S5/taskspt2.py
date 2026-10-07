import joblib
import pandas as pd 

new_passengers = pd.DataFrame([
    {"Pclass": 1, "Sex": "female", "Age": 25, "SibSp": 0, "Parch": 0, "Fare": 100.0, "Embarked": "S"},
    {"Pclass": 3, "Sex": "male",   "Age": 40, "SibSp": 1, "Parch": 0, "Fare": 8.0,   "Embarked": "S"},
    {"Pclass": 2, "Sex": "female", "Age": 30, "SibSp": 0, "Parch": 1, "Fare": 25.0,  "Embarked": "C"},
])

loaded_pipeline = joblib.load('full_pipeline.joblib')
preds = loaded_pipeline.predict(new_passengers)
probs = loaded_pipeline.predict_proba(new_passengers)[:, 1]

for i, row in new_passengers.iterrows():
    print(f"Passenger {i}: Pclass={row['Pclass']}, Sex={row['Sex']}, Age={row['Age']} "
          f"-> Predicted Survived={preds[i]} (probability={probs[i]:.3f})")