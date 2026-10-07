import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.cluster import KMeans, AgglomerativeClustering
import matplotlib.pylab as plt
from sklearn.metrics import silhouette_score
from scipy.cluster.hierarchy import dendrogram, linkage
from sklearn.decomposition import PCA

df = pd.read_csv("Mall_Customers.csv")

df = df.drop(columns=["CustomerID"])

le = LabelEncoder()
df["Gender"] = le.fit_transform(df["Gender"])

standardscaler = StandardScaler()
X_scaled = standardscaler.fit_transform(df[["Annual Income (k$)", "Spending Score (1-100)"]]) 


# kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
inertias = []
silhouettescore = []

for k in range(1,11):
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    inertias.append(kmeans.inertia_) 

for k in range(2, 11):
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    silhouettescore.append(silhouette_score(X_scaled, kmeans.labels_))

# plt.plot(range(1,11), inertias,  marker = 'o')
# plt.show()

# print("Inertias:", inertias)
# print("Silhouette Scores:", silhouettescore)

kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
kmeans.fit(X_scaled)
# labels = kmeans.labels_ 

# df["Cluster"] = labels # This creates a new column called Cluster. Add cluster labels to dataframe
# centroids = standardscaler.inverse_transform(kmeans.cluster_centers_)

# plt.figure(figsize=(8, 6))
# plt.scatter(
#     df["Annual Income (k$)"],
#     df["Spending Score (1-100)"],
#     c=df["Cluster"],
#     cmap="viridis",
#     s=50
# )

# plt.scatter(
#     centroids[:, 0],
#     centroids[:, 1],
#     marker="X",
#     s=200,
#     edgecolors="black"
# )

# plt.xlabel("Annual Income")
# plt.ylabel("Spending Score")
# plt.title("Customer Segmentation using K-Means")
# plt.show()

# linked = linkage(X_scaled, method='ward')
# dendrogram(linked)
# plt.show()

agg = AgglomerativeClustering(
    n_clusters=3,
    linkage="ward"
)
agg_labels = agg.fit_predict(X_scaled)

kmeans3 = KMeans(
    n_clusters=3,
    random_state=42,
    n_init=10
)
kmeans3_labels = kmeans3.fit_predict(X_scaled)

kmeans_score = silhouette_score(X_scaled, kmeans3_labels)
agg_score = silhouette_score(X_scaled, agg_labels)

# print("K-Means Silhouette Score:", kmeans_score)
# print("Agglomerative Silhouette Score:", agg_score)

pca = PCA(n_components=2)

standardscaler = StandardScaler()
X_all_scaled = standardscaler.fit_transform(df) 

pca_x = pca.fit_transform(X_all_scaled)

print("Explained Variance Ratio:")
print(pca.explained_variance_ratio_)
print("Total Explained Variance:")
print(pca.explained_variance_ratio_.sum())

kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
pca_labels = kmeans.fit_predict(pca_x)

plt.figure(figsize=(8, 6))

plt.scatter(
    pca_x[:, 0],
    pca_x[:, 1],
    c=pca_labels,
    cmap="viridis",
    s=50
)

plt.xlabel("PC1")
plt.ylabel("PC2")
plt.title("K-Means Clustering using PCA")

plt.show()

# I would trust the silhouette score more because it directly measures how compact and well seperated clusters are
# adding age changed the clustering in a more meaningful way, because it provides more info to help clustering