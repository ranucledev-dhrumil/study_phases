from sklearn.linear_model import LogisticRegression

X = [[1],[2],[3],[4],[5]] # Hours studied
y = [0, 0, 1, 1, 1] # 0 - Fail, 1 - Pass

model = LogisticRegression()
model.fit(X, y)
predicted_result = model.predict([[2.5]])

print(predicted_result)