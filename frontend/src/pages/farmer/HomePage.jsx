
import { useState, useMemo, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlantIcon,
  RepeatIcon,
} from "@phosphor-icons/react";
import { useAppContext } from "../../context/AppContext";
import { SeedDetails } from "./ProductDetail";
import {
  getAvailableListings,
  getCategories,
} from "../../api/productsApi";

const CATEGORY_IMAGES = {
  fruits: "/ico/orange.png",
  vegetables: "/ico/veg.png",
  grains: "/ico/cereal.png",
  cereals: "/ico/cereal.png",
  beans: "/ico/legume.png",
  legumes: "/ico/legume.png",
  tubers: "/ico/potato.png",
  roots: "/ico/potato.png",
  rare: "/ico/berry.png",
};

const getCategoryImage = (name) => {
  const key = (name || "").toLowerCase();
  return CATEGORY_IMAGES[key] || "/ico/cereal.png";
};

function HomePage() {
  const { openModal } = useAppContext();

  // Database data
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Interactive states
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [brokerSort, setBrokerSort] = useState("");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [visibleSeedCount, setVisibleSeedCount] = useState(8);

  // Fetch categories and active listings from Django
  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      try {
        setLoading(true);
        setError("");

        const [categoryResponse, listingResponse] = await Promise.all([
          getCategories(),
          getAvailableListings({ page_size: 100 }),
        ]);

        if (!isMounted) return;

        // Categories endpoint is not paginated in your backend.
        const categoryData = Array.isArray(categoryResponse)
          ? categoryResponse
          : categoryResponse?.results || [];

        // Listings endpoint may return a paginated response.
        const listingData = Array.isArray(listingResponse)
          ? listingResponse
          : listingResponse?.results || [];

        setCategories(categoryData);
        setListings(listingData);
      } catch (err) {
        console.error("Failed to load farmer homepage:", err);

        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              "Unable to load products. Please check your connection and try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Convert backend listings into the structure used by SeedDetails.
  const availableSeeds = useMemo(() => {
    return listings
      .filter((listing) => listing.is_active && listing.product)
      .map((listing) => {
        const product = listing.product;
        const dealer = listing.dealer || {};

        return {
          // Use listing ID because different dealers can list the same product.
          id: listing.id,
          productId: product.id,
          name: product.name || "Unnamed product",
          category: product.category_name || "Other",
          img: product.image || "/img/seed.png",
          price: Number(listing.price || 0),
          stock: Number(listing.stock || 0),
          broker:
            dealer.business_name || "Unknown dealer",
          brokerId: dealer.id,
          location:
            listing.location ||
            dealer.location ||
            dealer.district ||
            "Location not specified",
          description:
            listing.description ||
            "No product description available.",
          isVerified: dealer.is_verified,
          inStock: listing.in_stock,
        };
      });
  }, [listings]);

  // Build dealer cards from actual listing data.
  const brokers = useMemo(() => {
    const dealerMap = new Map();

    availableSeeds.forEach((seed) => {
      const dealerKey = seed.brokerId ?? seed.broker;

      if (!dealerMap.has(dealerKey)) {
        dealerMap.set(dealerKey, {
          id: dealerKey,
          name: seed.broker,
          img: "/img/broker.webp",
          location: seed.location,
          isVerified: seed.isVerified,
          categories: [],
          productCount: 0,
        });
      }

      const dealer = dealerMap.get(dealerKey);

      dealer.productCount += 1;

      if (!dealer.categories.includes(seed.category)) {
        dealer.categories.push(seed.category);
      }
    });

    return Array.from(dealerMap.values());
  }, [availableSeeds]);

  // Category card click and dropdown selection
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory((prev) =>
      prev === categoryName ? "All" : categoryName
    );

    setSelectedBroker(null);
    setVisibleSeedCount(8);
  };

  // Search
  const handleSearchSubmit = () => {
    setAppliedSearch(searchInput.trim());
    setVisibleSeedCount(8);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;

    setSearchInput(value);

    if (value === "") {
      setAppliedSearch("");
      setVisibleSeedCount(8);
    }
  };

  // Filter dealers using actual database data.
  const filteredBrokers = useMemo(() => {
    const query = appliedSearch.toLowerCase();

    return brokers
      .filter((broker) => {
        const matchesCategory =
          selectedCategory === "All" ||
          broker.categories.includes(selectedCategory);

        const matchesSearch =
          !query ||
          broker.name.toLowerCase().includes(query) ||
          broker.location.toLowerCase().includes(query) ||
          broker.categories.some((category) =>
            category.toLowerCase().includes(query)
          );

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (brokerSort === "location") {
          return a.location.localeCompare(b.location);
        }

        return 0;
      });
  }, [brokers, appliedSearch, selectedCategory, brokerSort]);

  // Filter actual listings.
  const filteredSeeds = useMemo(() => {
    const query = appliedSearch.toLowerCase();

    return availableSeeds.filter((seed) => {
      const matchesCategory =
        selectedCategory === "All" ||
        seed.category === selectedCategory;

      const matchesBroker =
        selectedBroker === null ||
        String(seed.brokerId ?? seed.broker) === String(selectedBroker);

      const matchesSearch =
        !query ||
        seed.name.toLowerCase().includes(query) ||
        seed.broker.toLowerCase().includes(query) ||
        seed.location.toLowerCase().includes(query) ||
        seed.description.toLowerCase().includes(query);

      return matchesCategory && matchesBroker && matchesSearch;
    });
  }, [
    availableSeeds,
    appliedSearch,
    selectedCategory,
    selectedBroker,
  ]);

  const visibleSeeds = filteredSeeds.slice(0, visibleSeedCount);
  const hasMoreSeeds = visibleSeedCount < filteredSeeds.length;

  return (
    <section className="page">
      {/* Welcome banner */}
      <div className="rounded-lg bg-emerald-950 text-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <PlantIcon size={16} weight="fill" />
            Good Seasons Ahead
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Certified Seeds from Verified Dealers
          </h1>

          <p className="text-sm text-emerald-100/90 max-w-xl">
            Discover agricultural products, compare prices and find dealers
            offering the products you need.
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-gray-600">
          Loading products and categories...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn primary mt-3"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Category Cards */}
          <div className="flex md:grid md:grid-cols-6 gap-4 mt-6 overflow-x-auto pb-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategorySelect(category.name)}
                className={`flex flex-col min-w-32 border rounded-lg p-4 items-center text-center cursor-pointer hover:shadow-lg transition-shadow duration-300 ${
                  selectedCategory === category.name
                    ? "bg-emerald-100 border-emerald-600"
                    : "bg-gray-200 border-gray-300"
                }`}
              >
                <img
                  src={getCategoryImage(category.name)}
                  alt={category.name}
                  className="h-10 w-10 rounded-md mb-4 object-cover"
                />

                <p className="font-semibold mb-2">{category.name}</p>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 items-center">
            <div className="flex flex-1 items-center gap-2 bg-white border border-gray-300 rounded-lg px-2">
              <MagnifyingGlassIcon size={20} />

              <input
                value={searchInput}
                onChange={handleSearchChange}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSearchSubmit()
                }
                className="input filled bg-transparent focus:bg-white focus:border-transparent focus:ring-0 focus:ring-transparent"
                placeholder="Search products, locations, or dealers..."
              />
            </div>

            <button
              type="button"
              onClick={handleSearchSubmit}
              className="btn primary"
            >
              Search
            </button>
          </div>

          {/* Dealers Section */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold mb-2">
                Dealers {selectedBroker ? "(Filtered)" : ""}
              </h2>

              <select
                value={brokerSort}
                onChange={(e) => setBrokerSort(e.target.value)}
                className="input filled !w-fit bg-white border border-gray-300 rounded-lg px-2 py-1"
              >
                <option value="">Sort by</option>
                <option value="location">Location</option>
              </select>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4">
              {filteredBrokers.length > 0 ? (
                filteredBrokers.map((broker) => (
                  <div
                    key={broker.id}
                    onClick={() =>
                      setSelectedBroker((prev) =>
                        String(prev) === String(broker.id)
                          ? null
                          : broker.id
                      )
                    }
                    className={`flex w-112 h-48 bg-white border rounded-lg gap-2 flex-shrink-0 cursor-pointer hover:shadow-md ${
                      String(selectedBroker) === String(broker.id)
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-gray-300"
                    }`}
                  >
                    <img
                      src={broker.img}
                      alt={broker.name}
                      className="w-48 rounded-l-lg object-cover"
                    />

                    <div className="flex flex-col p-4 justify-between min-w-0">
                      <p className="font-semibold">{broker.name}</p>

                      <div className="flex gap-2 my-2 border-b border-gray-300 pb-2">
                        <p className="text-sm text-gray-600">
                          {broker.location}
                        </p>
                      </div>

                      <p className="text-sm text-gray-600">
                        {broker.isVerified
                          ? "Verified dealer"
                          : "Registered dealer"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {broker.productCount} listed product(s)
                      </p>

                      <div className="flex gap-2 flex-wrap">
                        {broker.categories.map((category) => (
                          <span
                            key={category}
                            className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">
                  No dealers match your current filter.
                </p>
              )}
            </div>

            {selectedBroker !== null && (
              <button
                type="button"
                onClick={() => setSelectedBroker(null)}
                className="text-sm text-emerald-700 underline"
              >
                Clear dealer filter
              </button>
            )}
          </div>

          {/* Products Section */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold mb-2">
                Available Products
              </h2>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedBroker(null);
                  setVisibleSeedCount(8);
                }}
                className="input filled !w-fit bg-white border border-gray-300 rounded-lg px-2 py-1"
              >
                <option value="All">All Categories</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {visibleSeeds.length > 0 ? (
                visibleSeeds.map((seed) => (
                  <button
                    key={seed.id}
                    type="button"
                    onClick={() =>
                      openModal(
                        <SeedDetails seed={seed} />,
                        "Product Details",
                        null
                      )
                    }
                    className="bg-white border border-gray-300 rounded-lg text-left transition hover:-translate-y-0.5 hover:shadow-md overflow-hidden"
                  >
                    <img
                      src={seed.img}
                      alt={seed.name}
                      onError={(e) => {
                        e.currentTarget.src = "/img/seed.png";
                      }}
                      className="h-48 w-full rounded-t-lg object-cover"
                    />

                    <div className="flex flex-col p-4">
                      <p className="font-semibold h-[2lh] md:h-auto">
                        {seed.name}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {seed.category}
                      </p>

                      <p className="text-sm text-emerald-600 font-bold text-xl mt-2">
                        UGX {seed.price.toLocaleString()}
                      </p>

                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-2 pt-2 border-t border-gray-300 gap-1">
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {seed.broker}
                        </p>

                        <p className="text-sm text-gray-600">
                          Stock: {seed.stock}
                        </p>
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        {seed.location}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-600 col-span-full">
                  No products found matching your criteria.
                </p>
              )}
            </div>
          </div>

          {/* Load More */}
          {hasMoreSeeds && (
            <button
              type="button"
              onClick={() => setVisibleSeedCount((prev) => prev + 4)}
              className="btn primary md:w-fit !self-center mt-6"
            >
              Load More <RepeatIcon size={16} />
            </button>
          )}

          {/* No listings at all */}
          {availableSeeds.length === 0 && (
            <div className="py-10 text-center text-gray-600">
              <p className="font-semibold">No products available yet.</p>
              <p className="text-sm mt-2">
                Products will appear here when dealers publish active listings.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default HomePage;
