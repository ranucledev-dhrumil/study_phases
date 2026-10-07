# 1. What is a Tensor?
# You already know NumPy arrays. A tensor is PyTorch's version of that — a multi-dimensional array — but with two superpowers NumPy arrays don't have:
# It can live on a GPU for fast parallel computation.
# It can automatically track operations for gradient computation (we'll cover this in Session 2).

# Scalar (0-D tensor): a single number → 5
# Vector (1-D tensor): a list of numbers → [1, 2, 3]
# Matrix (2-D tensor): a grid of numbers → [[1,2],[3,4]]
# Tensor (N-D): anything with 3+ dimensions → e.g., a batch of RGB images is a 4-D tensor: (batch_size, channels, height, width)

# 2. Why Tensors Matter for Math:
# Neural networks are, underneath, layers of matrix multiplications followed by nonlinear functions. So before touching PyTorch code, let's ground the math:
# Vectors represent things like a single data sample's features: [height, weight, age].
# Dot product of two vectors a and b:
# a ⋅ b = i ∑ (​ai* ​bi​)
# Example: [1,2,3] · [4,5,6] = 1×4 + 2×5 + 3×6 = 32

# Matrix multiplication is just many dot products at once. 
# If A is (m×n) and B is (n×p), result C is (m×p), where each entry C[i][j] is the dot product of row i of A and column j of B.
# Rule for matrix multiplication: inner dimensions must match — (m×n) @ (n×p) works, (m×n) @ (p×q) doesn't unless n == p.

# 3. Creating Tensors
import torch

# From data
t1 = torch.tensor([1, 2, 3])
t2 = torch.tensor([[1.0, 2.0], [3.0, 4.0]])

# Key Attributes:
t2.shape    # torch.Size([2, 2])
t2.dtype    # torch.float32
t2.device   # cpu or cuda
t2.ndim     # number of dimensions

# Common constructors
zeros = torch.zeros(3, 4)      # 3x4 tensor of zeros
ones = torch.ones(2, 2)
rand = torch.rand(2, 3)        # uniform [0,1)
randn = torch.randn(2, 3)      # standard normal distribution
arange = torch.arange(0, 10, 2)  # like Python range

# From/to NumPy
import numpy as np
np_arr = np.array([1, 2, 3])
t3 = torch.from_numpy(np_arr)   # shares memory!
back_to_np = t3.numpy()

# 4. Tensor Operations:
a = torch.tensor([1.0, 2.0, 3.0])
b = torch.tensor([4.0, 5.0, 6.0])

a + b          # element-wise: [5, 7, 9]
a * b          # element-wise: [4, 10, 18]
a.dot(b)       # dot product: 32.0

A = torch.rand(2, 3)
B = torch.rand(3, 4)
C = A @ B              # matrix multiplication → shape (2, 4)
C2 = torch.matmul(A, B)  # same thing

# Reductions
a.sum()
a.mean()
a.max()

# 5. Broadcasting: Broadcasting lets tensors of different shapes be combined without manually copying data
# Rule: align shapes from the right; dimensions are compatible if they're equal, or one of them is 1.
a = torch.tensor([[1, 2, 3], [4, 5, 6]])  # shape (2,3)
b = torch.tensor([10, 20, 30])            # shape (3,)
a + b
# b is "stretched" to (2,3) automatically:
# [[11,22,33],
#  [14,25,36]]


# 6. Reshaping:
x = torch.arange(12)          # shape (12,)
x.view(3, 4)                  # reshape to (3,4) — shares memory, must be contiguous
x.reshape(3, 4)                # safer, works even if non-contiguous
x.unsqueeze(0)                 # add a dimension → shape (1,12)
x.squeeze()                    # remove dimensions of size 1
x.T                             # transpose (2D)

# 7. GPU vs CPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
t = torch.rand(3,3).to(device)   # move tensor to GPU if available

a = torch.tensor([1, 2, 3]) 
b = torch.tensor([[1],[2],[3]]) 
print(a)
print(b)
print((a + b).shape) 