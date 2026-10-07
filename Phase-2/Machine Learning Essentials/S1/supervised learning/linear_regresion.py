# Linear Regression:
# 1 - finds a pattern in old data
# 2 - straight line
# 3 - line  y = m*x + b

# 6 - single number, 
# [6] - single element 1d-list,
# [[6]] - single element 2d-List

from sklearn.linear_model import LinearRegression

X = [[1],[2],[3],[4],[5]] # Hours studied
y = [40, 50, 65, 75, 90] # Marks got

model = LinearRegression()
model.fit(X, y)
predicted_marks = model.predict([[7]])

print(predicted_marks)

# Its not about the line, it about the story
# accuracy is not the goal always

