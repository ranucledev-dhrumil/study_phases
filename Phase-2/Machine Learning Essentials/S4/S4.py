# 1. What's Different Here: No y (labels). The model finds structure in X alone — groupings, patterns, or reduced representations.

# 2. K-Means Clustering: 
# Groups data into k clusters by minimizing the distance between points and their cluster's center (centroid).
# How it works (iterative):
# Randomly place k centroids.
# Assign each point to its nearest centroid (by Euclidean distance).
# Recompute each centroid as the mean of its assigned points.
# Repeat steps 2–3 until centroids stop moving (convergence).
from sklearn.cluster import KMeans

kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
kmeans.fit(X_scaled)

kmeans.labels_       # cluster assignment for each point
kmeans.cluster_centers_  # coordinates of each centroid
kmeans.predict(X_new)    # assign new points to existing clusters
# Requires scaling — same reason as KNN: it's distance-based.
# n_init — K-Means is sensitive to random initialization (can converge to a bad local optimum), so sklearn runs it multiple times with different starting centroids and keeps the best result.
# You must choose k in advance — this is the hard part.

# Choosing k — the Elbow Method:
inertias = []
for k in range(1, 11):
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(X_scaled)
    inertias.append(km.inertia_)  # sum of squared distances to nearest centroid

plt.plot(range(1, 11), inertias, marker='o')
# Look for the "elbow" — the point where adding more clusters stops meaningfully reducing inertia. Before the elbow, clusters are genuinely separating structure; after it, you're just carving noise into smaller pieces.

# Silhouette Score — a more rigorous alternative for choosing k, measures how similar a point is to its own cluster vs. other clusters (-1 to 1, higher is better):
from sklearn.metrics import silhouette_score
score = silhouette_score(X_scaled, kmeans.labels_)
# Limitations: assumes roughly spherical, similar-sized clusters; sensitive to outliers; you must pick k upfront.

# 3. Hierarchical Clustering:
# Builds a tree of nested clusters instead of a flat partition. Two approaches:
# Agglomerative (bottom-up, most common) — starts with every point as its own cluster, repeatedly merges the two closest clusters until one remains.
# Divisive (top-down) — opposite direction, rarely used in practice.

from sklearn.cluster import AgglomerativeClustering
from scipy.cluster.hierarchy import dendrogram, linkage
import matplotlib.pyplot as plt

# Visualize the merge tree first
linked = linkage(X_scaled, method='ward')
dendrogram(linked)
plt.show()

# Then fit with chosen number of clusters
agg = AgglomerativeClustering(n_clusters=3)
labels = agg.fit_predict(X_scaled)

# "Linkage" — how distance between clusters (not individual points) is measured:
# ward — minimizes variance within merged clusters (most common default, tends to produce even-sized clusters)
# complete — max distance between any two points across clusters
# average — average distance between all point pairs across clusters

# Key advantage over K-Means: you don't need to pick k upfront — the dendrogram (tree diagram) lets you visually decide how many clusters make sense by "cutting" the tree at a chosen height. Also doesn't assume spherical clusters the way K-Means does.

# Downside: computationally expensive for large datasets (doesn't scale as well as K-Means).

# 4. PCA — Principal Component Analysis:
# Not clustering — dimensionality reduction. Takes high-dimensional data and projects it onto fewer dimensions (principal components) while preserving as much variance (information) as possible.
# Why you'd use it:
# Visualization (compress to 2D/3D to plot high-dimensional data)
# Speed up downstream models (fewer features = faster training)
# Remove multicollinearity (components are mathematically uncorrelated with each other)
# Noise reduction (low-variance components often represent noise, dropping them can help)

# Intuition: PCA finds the direction (axis) in the data with the most spread/variance — that's PC1. Then the next direction, orthogonal to PC1, with the most remaining variance — that's PC2. And so on.

from sklearn.decomposition import PCA

pca = PCA(n_components=2)   # or n_components=0.95 to keep 95% of variance automatically
X_pca = pca.fit_transform(X_scaled)

pca.explained_variance_ratio_   # how much variance each component captures

# Requires scaling first — PCA is variance-based, so unscaled features (e.g., income in thousands vs age in tens) would dominate purely due to scale, not actual importance.
# explained_variance_ratio_ tells you, e.g., [0.62, 0.23] — PC1 captures 62% of the total variance, PC2 captures 23% — together 85% of the original information is preserved in just 2 dimensions.
# Trade-off: the new components (PC1, PC2...) are linear combinations of original features — they lose direct interpretability. You can't say "PC1 = income" anymore; it's some blend.

# 5. Putting Clustering + PCA Together (common pattern):
# A frequent real-world workflow: reduce dimensions with PCA first, then cluster in the reduced space — faster, and can produce cleaner clusters when there are many correlated/noisy features.
# This also gives you an easy way to visualize clusters that originally lived in high-dimensional space — you literally cannot plot 10 dimensions, but you can plot the first 2 principal components.