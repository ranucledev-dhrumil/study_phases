# AI > ML > DL

# Deep Learning: learn through many layers
# Data > Model > Prediction(prediction pipeline)

# Pytorch: 
# 1. Build the model, 2. Train, 3. Prediction
# idea -> pytorch -> trained model

# model: i/p -> Machine -> o/p
# training: learning from examples
# training loop: repeating learning loop until machine learns better and give better results. learn - check mistakes - improve - repeat
# prediction: provide result as output as learned from the training loop
# loss: correct result - predicted result
# optimizer: fixes the mistakes based on the loss calculated
# parameters: how model reacts to data is decided by parameters - what the model learns
# epoch: a full pass over all training data
# batch: splitting large data into smaller parts are called batches

import torch
import numpy as np

x = torch.rand(2,4)
print(x.shape)

d2 = torch.tensor([
    [1,2,3],
    [4,5,6]
]) 

print(d2.shape)
print(d2*2)

# tensor and numpy - shares memory
arr = np.array([1,2,3])
n = torch.from_numpy(arr) # this uses the same memory as the numpy array that is, arr and n points to same memory location, any changes to one, reflects to the other

# y = w * x + b
# where, y - output,
# w = slope
# x - input
# b = starting point

# step1 input data x
x = torch.tensor([1., 2., 3., 4.])

# step2 y
y = torch.tensor([2., 4., 6., 8.])

# step3 wrong guesses for w and b
w = torch.tensor(0.0)
b = torch.tensor(0.0)

# step4
y_pred = w * x + b

loss = ((y_pred - y) ** 2).mean()

print("Predicted Values", y_pred)
print("Actual Values", y)
print("Loss", loss)