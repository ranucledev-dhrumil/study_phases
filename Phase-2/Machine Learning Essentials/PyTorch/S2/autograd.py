# Autograd:
# fix to reduce losses, increase or decrease 

# Step - 1: Guessing/Predict
# Step - 2: measure the losses
# Step - 3: automatic fix increase or decrease based on the calculated loss
# Step - 4: apply the fix

# requires_grad = True - tells pytorch that these numbers can be changed in future for improving the results
import torch
# w = torch.tensor(3.0, requires_grad=True)
# x = torch.tensor(2.0)

# y = w * x 

# print(y)

# Computation Graph: stores the fixes applied
# backward() - tells us who is responsible for mistake and how much 
# - requires loss number, requires_grad=True, computation graph
# .grad - 

# w = torch.tensor(3.0, requires_grad=True)
# x = torch.tensor(2.0)

# y_pred = w * x 
# y_true = torch.tensor(10.0)

# loss = ( y_pred - y_true ) ** 2
# print(loss)

# loss.backward()
# w.grad_zero_()
# print(w.grad)

# .grad = stores instructions on how to change the number to reduce the mistake: tells us two things
# 1. direction - if w.grad > 0 -> decrease w, if w.grad < 0 -> increase w
# 2. amount - 

# print("Prediction: ", y_pred.item())
# print("Loss: ", loss.item())
# print("w.grad: ", w.grad.item())

# Gradient Descent
# new_value = old_value - (learn_rate * gradient)
# old_value = current guess
# gradient = .grad
# learning_rate = 0.1 percent

# fixed input: 
# x = torch.tensor(2.0)

# learnable number: 
# w = torch.tensor(3.0, requires_grad=True)

# correct answer: 
# y_true = torch.tensor(10.0)

# learning rate:
# lr = 0.1

# y_pred = w * x
# loss = (y_pred - y_true) ** 2

# Computes the gradient of current tensor wrt graph leaves.
# loss.backward()

# print("Before Update: ")
# print("w: ", w.item())
# print("loss: ", loss.item())
# print("gradient: ", w.grad.item())


# with torch.no_grad(): # do not track this step, as it is a improvement step/ correction step
#     w -= (lr * w.grad)

# reset gradient - it is necessary as the losses will be added up if this is not cleared to zero
# w.grad.zero_()

# print("After update: ")
# print("w: ", w.item())

# Training Loop
# repeating steps until mistakes becomes smaller
# 1.prediction - 2.measure(loss) - 3.find (using backward) - 4.fix using gradient descent - 5.clear

# with - temporarily change behaviour and then go back to normal 

x = torch.tensor([1., 2., 3., 4.])
y_true = torch.tensor([2., 4., 6., 8.])

w = torch.tensor(0.0, requires_grad=True)

lr = 0.1

epochs = 10

for epoch in range(epochs):
    y_pred = w * x

    loss = ((y_pred - y_true) ** 2).mean()

    loss.backward()

    with torch.no_grad():
        w -= lr * w.grad

    print(f"Epoch {epoch+1}: w={w.item():.4f}, loss={loss.item():.4f}")