# A box :
# 1. Learning Numbers
# 2. Rules
# 3. Behaviour

# Raw Tensors vs Trainable Model

# nn.module: 
# class Structure
# Layers
# Activation Function 
# Optimiser
# Saving Model

# Input features: how many layers IN?
# Output features: how many OUT?

# Weight: Inputs importance: if weight high - input importance is high
# Bias: a small adjustment - up/down

# Shape: 
# Input -> input_features
# output fixed
# groups (batches)

import torch
import torch.nn as nn

# nn.Linear(input_features, output_features)
# nn.Linear(3, 1) - [height, weight, age] > risk_score

# output = (input * weights) + bias

# nn.Linear(2, 3)
# [?, ?, ?] 3 numbers
# [?, ?] 2 outputs

# layer = nn.Linear(3,2)

# x = torch.tensor([1.0, 2.0, 3.0])
# y = layer(x)
# print(y)


# layer calculation - linear , we will be at the same place after all the calculations
# the activation function solves this problem of ours - it decides which info to move further and which info to block - gateway, decision maker
# it is applied afetr a layer: Linear - activation - Linear - ...
# nn.RELU - Rectified Linear Unit:  -ve -> 0, +ve -> keep - it is used mostly in hidden layers
# nn.sigmoid - Yes/No - turns numbers to 0 or 1, 0 - NO, 1 - Yes, it is used in final layers only
# nn.sigmax - takes many numbers and converts it to one number - Multiclass output -then choose nn.sigmax

# optimiser: w -= lr * w.grad - optimiser does this things
# - SGD: torch.optim.SGD(model.parameters(), lr = 0.01)
# - Adam: torch.optim.Adam(model.parameters(), lr = 0.001)

import torch.optim as optim

class MyModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.Linear = nn.Linear(1,1)

    def forward(self, x):
        return self.Linear(x)

x = torch.tensor([[1.], [2.], [3.], [4.]])
y = torch.tensor([[2.], [4.], [6.], [8.]])

model = MyModel()

loss_fn = nn.MSELoss()
optimizer = optim.Adam(model.parameters(), lr = 0.1)

for epoch in range(10):

    optimizer.zero_grad()
    y_pred = model(x)
    loss = loss_fn(y_pred, y)
    loss.backward()
    optimizer.step()

    print(f"Epoch {epoch+1}, Loss = {loss.item():.4f}")

torch.save(model.state_dict(), "linear_model.pth")

# DataLoaders
# sending data in batches
# dataset - 1 example
# data loader - group into batches
# model - learn each batches one by one

