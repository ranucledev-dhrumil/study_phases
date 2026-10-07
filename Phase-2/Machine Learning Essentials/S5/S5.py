# Part A: Model Persistence: Once a model is trained, you don't want to retrain it every time you need a prediction — you save it to disk and load it later (in an API, app, or another script).

# Pickle vs Joblib:
# Both serialize Python objects to disk. For sklearn models specifically, joblib is preferred — it's more efficient for objects containing large NumPy arrays (which is exactly what trained models are full of: coefficients, tree structures, support vectors, etc.).

import joblib

# Save
joblib.dump(model, 'model.joblib')
joblib.dump(scaler, 'scaler.joblib')   # save your scaler too!

# Load
loaded_model = joblib.load('model.joblib')
loaded_scaler = joblib.load('scaler.joblib')

predictions = loaded_model.predict(loaded_scaler.transform(new_data))
# Critical point people often miss: if your training pipeline used a StandardScaler, OneHotEncoder, or any fitted transformer, you must save and load those too — not just the model. 
# A model trained on scaled data will produce garbage predictions on raw unscaled input. 
# This is exactly why Pipeline objects are so convenient to persist — save the whole pipeline as one object:
joblib.dump(full_pipeline, 'pipeline.joblib')   # preprocessing + model together
loaded_pipeline = joblib.load('pipeline.joblib')
loaded_pipeline.predict(new_raw_data)            # handles scaling internally

# Pickle (standard library, no install needed) works similarly:
import pickle

with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('model.pkl', 'rb') as f:
    loaded_model = pickle.load(f)

# Important caveats:
# Version compatibility — a model pickled with scikit-learn==1.3 may throw warnings or break when loaded with scikit-learn==1.5. Always note the sklearn version used when saving (production systems often pin exact versions).
# Security — never unpickle files from untrusted sources; pickle.load can execute arbitrary code. This is a real, well-known attack vector.
# Save the whole pipeline, not just the final estimator, unless you're confident you'll always preprocess identically at inference time.


# Part B: Intro to Neural Networks:
# A neural network is built from neurons organized in layers. Each neuron takes inputs, applies weights, sums them, adds a bias, then passes the result through an activation function.
# output = activation(w1*x1 + w2*x2 + ... + wn*xn + b) 
# This should look familiar — it's the exact same linear combination as Linear/Logistic Regression. A single neuron with a sigmoid activation is logistic regression. Neural networks get their power from stacking many of these together in layers.

# Architecture
# Input Layer → Hidden Layer(s) → Output Layer
# Input layer — one node per feature, no computation, just passes data in.
# Hidden layer(s) — where the actual learning happens; each neuron connects to every neuron in the previous layer (in a "fully connected"/"dense" network).
# Output layer — produces the final prediction (1 node for regression/binary classification, multiple nodes for multi-class).

# More hidden layers/neurons = more capacity to learn complex patterns, but also more risk of overfitting and more compute needed — same bias-variance tradeoff you've seen throughout this course, just with a much bigger knob.
# Activation Functions:
# Without activation functions, stacking linear layers is pointless — a chain of linear operations is still just one linear operation. Activation functions introduce non-linearity, which is what lets neural nets learn complex, curved decision boundaries.

# Function  : Sigmoid
# Formula   : 1 / (1 + e^-x)
# Used for  : Output layer of binary classification (0-1 probability)

# Function  : ReLU
# Formula   : max(0, x)
# Used for  : Most common in hidden layers — simple, fast, and avoids some training issues

# Function  : Tanh
# Formula   : (e^x - e^-x) / (e^x + e^-x)
# Used for  : Similar to sigmoid but centered at 0 (-1 to 1)

# Function  : Softmax
# Formula   : Normalizes outputs to sum to 1
# Used for  : Output layer for multi-class classification

# How It Learns: Forward Pass + Backpropagation
# 1. Forward pass — input data flows through the network layer by layer, producing a prediction.
# 2. Loss calculation — compare prediction to actual value (MSE for regression, cross-entropy for classification
# 3. Backpropagation — the error is propagated backward through the network, calculating how much each weight contributed to the error (using calculus — the chain rule).
# 4. Weight update — weights are nudged in the direction that reduces error, scaled by a learning rate (this is Gradient Descent again, applied to a much bigger, layered system).
# 5. Repeat for many epochs (full passes over the training data) until the loss stops improving meaningfully.

# This is conceptually the same optimization idea from Linear Regression (minimize a cost function via gradient descent) — just applied through many stacked layers, which is why backprop needs the chain rule to figure out each layer's contribution to the final error.

# Hands-On Bridge: scikit-learn's MLPClassifier:sklearn includes a basic neural network implementation — MLPClassifier (Multi-Layer Perceptron) — good for understanding the API pattern before moving to TensorFlow/PyTorch
from sklearn.neural_network import MLPClassifier

mlp = MLPClassifier(
    hidden_layer_sizes=(64, 32),   # two hidden layers: 64 neurons, then 32
    activation='relu',
    solver='adam',                  # optimization algorithm (a smarter gradient descent variant)
    max_iter=500,
    random_state=42
)
mlp.fit(X_train_scaled, y_train)    # neural nets ALWAYS need scaled input
predictions = mlp.predict(X_test_scaled)

# Always scale features for neural nets — even more critical than for KNN/SVM, since unscaled inputs can cause unstable/slow training.
# hidden_layer_sizes=(64, 32) — a tuple where each number is a layer's neuron count; length of tuple = number of hidden layers.
# Same .fit() / .predict() / .predict_proba() API as every other sklearn classifier you've used — this is the payoff of sklearn's consistent interface desig

# This won't feel dramatically different to use than LogisticRegression or SVC — that's intentional. The real depth (custom architectures, GPU training, CNNs, RNNs, transformers) is what TensorFlow/PyTorch will give you next, but the conceptual foundation (layers, activations, backprop, loss) is exactly what carries forward.