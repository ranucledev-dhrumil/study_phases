# 1. Why Autograd Exists: Training a neural network means adjusting weights to reduce error. To know which direction to adjust each weight, you need the gradient of the loss with respect to that weight — basically "if I nudge this weight slightly, how much does the error change?"

# 2. The Math: Derivatives, Chain Rule, Gradient Descent
# Derivative of a function measures its rate of change. For f(x) = x², the derivative is f'(x) = 2x. It tells you the slope at any point x.

# Partial derivative: when a function has multiple inputs, e.g. f(x, y) = x²y, the partial derivative with respect to x treats y as constant: ∂f/∂x = 2xy.

# Gradient: the vector of all partial derivatives — it points in the direction of steepest increase of the function. To minimize a loss function, you move in the opposite direction of the gradient. That's gradient descent:

# 𝑤new = 𝑤old − 𝜂 ⋅ (∂𝐿 / ∂𝑤)
# where η (eta) is the learning rate — how big a step you take.

# Chain rule: if y = f(g(x)), then dy/dx = f'(g(x)) · g'(x). Neural networks are long chains of functions (layer after layer), so computing the gradient of the loss with respect to an early-layer weight requires multiplying derivatives all the way through the chain — this is exactly backpropagation.

# Example: y = (3x + 1)². Let u = 3x + 1, so y = u².
# dy/du = 2u
# du/dx = 3
# dy/dx = 2u · 3 = 6u = 6(3x+1)
# This is precisely what autograd computes automatically, layer by layer, in reverse.

# 3. Autograd in PyTorch
import torch

x = torch.tensor(2.0, requires_grad=True)  # track gradients for x
y = (3*x + 1)**2

y.backward()   # compute dy/dx via chain rule
print(x.grad)  # should be 6*(3*2+1) = 42.0
# requires_grad=True tells PyTorch: "remember every operation done to this tensor, so I can later differentiate through it."
# Calling .backward() walks the computational graph backward from y to x, applying the chain rule at each step, and stores the result in x.grad.

# 4. Computational Graph:
# Every operation on a requires_grad=True tensor builds a node in a graph. y.grad_fn shows the last operation that created it:
x = torch.tensor(2.0, requires_grad=True)
y = x * 3
z = y + 1
print(z.grad_fn)   # <AddBackward0 ...>
# This graph is built dynamically (PyTorch is "define-by-run") — it's constructed fresh every forward pass, which is different from older static-graph frameworks.

# 5. Gradients with Multiple Variables
x = torch.tensor(2.0, requires_grad=True)
y = torch.tensor(3.0, requires_grad=True)
z = x**2 * y + y**3

z.backward()
print(x.grad)  # dz/dx = 2xy = 2*2*3 = 12
print(y.grad)  # dz/dy = x^2 + 3y^2 = 4 + 27 = 31

# 6. Important Practical Details:
# Gradients accumulate — calling .backward() multiple times adds to .grad rather than replacing it. 
# In training loops you must zero them out each step:
x.grad.zero_()   # or optimizer.zero_grad() later

# Only scalars can call .backward() directly without arguments (like a loss value). For non-scalar outputs, you need to pass a gradient argument — you won't need this often at this stage.
# Stopping gradient tracking — sometimes you want to use a tensor's value without tracking gradients

with torch.no_grad():
    y = x * 2   # not tracked

# or
x.detach()   # returns a tensor detached from the graph
# Leaf tensors: x above is a "leaf" (created directly with requires_grad=True, not from an operation). Only leaf tensors accumulate .grad by default; intermediate tensors don't unless you call .retain_grad().

# 7. Connecting to Gradient Descent:
# Putting it together — the actual pattern you'll use in every training loop from Session 3 onward:
w = torch.tensor(5.0, requires_grad=True)
lr = 0.1

for step in range(5):
    loss = (w - 3)**2         # some function to minimize (minimum at w=3)
    loss.backward()
    with torch.no_grad():
        w -= lr * w.grad
    w.grad.zero_()
    print(w.item())

