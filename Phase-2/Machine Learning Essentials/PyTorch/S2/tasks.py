import torch

x = torch.tensor(4.0, requires_grad=True)

y = x**2 + 3*x + 1

y.backward()

print(x.grad) # $ tensor(11.)

# dy/dx = 2x + 3 = 2(4.0) + 3 = 11.0

a = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(5.0, requires_grad=True)

z = a**2 * b + b**2

z.backward()

print(a.grad)
print(b.grad)
 
# ∂z/∂a = 2ab = 20
# ∂z/∂b = a^2 + 2b = 4 + 10 = 14

w = torch.tensor(0.0, requires_grad=True)

# i = (w - 7) ** 2

epochs = 3
lr = 0.1

for epoch in range(epochs):

    loss = (w - 7) ** 2

    loss.backward()

    with torch.no_grad():
        w -= lr * w.grad

    w.grad.zero_()

    print(f"epoch {epoch+1}: w = {w.item():.4f}, loss = {loss.item():.4f}")


# w.grad.zero_() - without this:
# w2 = torch.tensor(0.0, requires_grad=True)
# for epoch in range(3):
#     loss = (w2 - 7) ** 2
#     loss.backward()   # no zero_() — grad accumulates
#     print(f"epoch {epoch+1}: w2.grad = {w2.grad}")
#     with torch.no_grad():
#         w2 -= 0.1 * w2.grad