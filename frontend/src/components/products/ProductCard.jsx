import "../../styles/product-card.css";

const PLACEHOLDER_IMAGE =
  "https://placehold.co/600x400?text=No+Product+Image";

export default function ProductCard({ product }) {
  const imageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `http://127.0.0.1:8000${product.image}`
    : PLACEHOLDER_IMAGE;

  return (
    <div className="product-card">
      <div className="product-card-image">
        <img
          src={imageUrl}
          alt={product.name}
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER_IMAGE;
          }}
        />
      </div>

      <div className="product-card-content">
        <span className="product-category">
          {product.category_name || "Agricultural product"}
        </span>

        <h3>{product.name}</h3>

        <p>{product.description || "No description available."}</p>

        {product.unit && (
          <span className="product-unit">Sold per {product.unit}</span>
        )}
      </div>
    </div>
  );
}