# Regression - Number Prediction
# - Linear Regression - y = m*x + b

# Classification - Category Prediction  
# - Logistic Regressio
# - KNN (K-Nearest Neighbours)
# - Decision Tree Classifier

# Overfitting happens when a model learns the training data too well, including its noise and random patterns.
# Training accuracy → very high
# Test/new-data accuracy → low
# Model → too complex

# Underfitting is the opposite. The model is too simple to learn the important patterns in the data.
# Training accuracy → low
# Test accuracy → low
# Model → too simple

# model.fit(X_train, y_train):
# Here:
# X_train = input/training features
# y_train = correct answers/target values
# model = your machine learning algorithm
# During fit(), the model looks at the training examples and learns the patterns.
# fit = learn/train

# model.predict(X_test):
# predict() is used after training to make predictions on new data. 
# predict = use what was learned to give an answer

# Training data
#      ↓
# model.fit(X_train, y_train)
#      ↓
# Model learns patterns
#      ↓
# model.predict(X_test)
#      ↓
# Predictions