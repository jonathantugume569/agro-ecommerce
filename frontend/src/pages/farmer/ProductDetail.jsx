export function SeedDetails({ seed }) {
  return (
    <article>
      <img
        src={seed.img}
        alt={seed.name}
        className="h-56 w-full rounded-lg object-cover"
      />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-emerald-600">
        {seed.category}
      </p>
      <h2 className="mt-1 text-xl font-bold">{seed.name}</h2>
      <p className="mt-2 text-2xl font-bold text-emerald-600">
        UGX {seed.price.toLocaleString()}
      </p>
      <p className="mt-3 text-gray-600">{seed.description}</p>
      <div className="mt-4 flex gap-4">
        <button type="button" className="btn secondary flex-1">
          Add to Cart
        </button>
        <button type="button" className="btn primary flex-1">
          Order Now
        </button>
      </div>
      <div className="mt-4 flex justify-between border-t border-gray-200 pt-3 text-sm text-gray-600">
        <span>{seed.broker}</span>
        <span>{seed.stock} in stock</span>
      </div>
    </article>
  );
}
