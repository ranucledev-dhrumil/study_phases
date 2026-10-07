from sklearn.tree import DecisionTreeClassifier

X = [[7, 2], [8, 3], [9, 8], [10, 9]] # [size, color]
y = [0, 0, 1, 1] # 0 - Apple, 1 - Orange

model = DecisionTreeClassifier()
model.fit(X, y)
predicted_result = model.predict([[8.5, 5]])[0]

print(predicted_result)