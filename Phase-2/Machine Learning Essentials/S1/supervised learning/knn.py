from sklearn.neighbors import KNeighborsClassifier

X = [[180, 7], [200, 7.5], [250, 8], [300, 8.5], [330, 9], [360, 9.5]] # [weight, size]
y = [0, 0, 0, 1, 1, 1] # 0 - Apple, 1 - Orange

model = KNeighborsClassifier(n_neighbors=3)
model.fit(X, y)
predicted_result = model.predict([[360, 9.1]])[0]

print(predicted_result)