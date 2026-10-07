import torch

X = torch.rand(3,4)

W = torch.randn(4,2)
b = torch.randn(2,)

output = X @ W + b

print(output.shape)

print("X @ W: ", (X @ W).shape)
print("X @ W + b: ", (X @ W + b).shape)

reshaped_tensor = output.reshape(6,)
numpy_arr = reshaped_tensor.numpy()

print(reshaped_tensor)
print(numpy_arr, type(numpy_arr))

a = torch.tensor([1.0, 2.0, 3.0])
b = torch.tensor([4.0, 5.0, 6.0])

def manual_dot(a, b):
    result = 0

    for i in range(len(a)):
        result += a[i] * b[i]

    return result

print(manual_dot(a, b), torch.dot(a, b))  # should match