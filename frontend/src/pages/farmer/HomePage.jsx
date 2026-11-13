import { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  PlantIcon,
  RepeatIcon,
  StarIcon,
} from "@phosphor-icons/react";

function HomePage() {
  const categories = [
    { id: 1, name: "Fruits", img: "/ico/orange.png" },
    { id: 2, name: "Vegetables", img: "/ico/veg.png" },
    { id: 3, name: "Grains", img: "/ico/cereal.png" },
    { id: 4, name: "Beans", img: "/ico/legume.png" },
    { id: 5, name: "Tubers", img: "/ico/potato.png" },
    { id: 6, name: "Rare", img: "/ico/berry.png" },
  ];

  const mockBrokers = [
    {
      id: 1,
      name: "Victoria Seed Co.",
      img: "/img/broker.webp",
      location: "Kampala",
      rating: 4.8,
      categories: ["Grains", "Beans"],
      description:
        "NARO-certified hybrid maize and drought-tolerant legume specialists serving central region farmers.",
    },
    {
      id: 2,
      name: "Nile Valley Agro-Inputs",
      img: "/img/broker.webp",
      location: "Jinja",
      rating: 4.6,
      categories: ["Vegetables", "Fruits"],
      description:
        "High-germination F1 horticultural seeds, grafted fruit seedlings, and drip-irrigation starter packs.",
    },
    {
      id: 3,
      name: "Rwenzori Highland Growers",
      img: "/img/broker.webp",
      location: "Fort Portal",
      rating: 4.9,
      categories: ["Tubers", "Rare"],
      description:
        "Disease-free tissue-culture potato tubers and heirloom highland berries adapted for cool climates.",
    },
    {
      id: 4,
      name: "Gulu Savannah Seeds",
      img: "/img/broker.webp",
      location: "Gulu",
      rating: 4.4,
      categories: ["Grains", "Beans"],
      description:
        "Bulk sesame, sorghum, and high-iron bush bean varieties bred for northern dry spells.",
    },
    {
      id: 5,
      name: "Ankole Fresh Genetics",
      img: "/img/broker.webp",
      location: "Mbarara",
      rating: 4.7,
      categories: ["Fruits", "Tubers", "Vegetables"],
      description:
        "Clean banana suckers, passion fruit vines, and fast-maturing kitchen garden vegetable packs.",
    },
  ];

  const mockSeeds = [
    {
      id: 1,
      name: "Longe 5 (Nalongo) Maize",
      category: "Grains",
      img: "/img/seed.png",
      price: 15000,
      stock: 120,
      broker: "Victoria Seed Co.",
      description:
        "Quality protein maize (QPM), 115-day maturity, 94% tested germination rate (2kg pack).",
    },
    {
      id: 2,
      name: "NAROBean 2 (High-Iron)",
      category: "Beans",
      img: "/img/seed.png",
      price: 12000,
      stock: 85,
      broker: "Victoria Seed Co.",
      description:
        "Bush bean variety resistant to root rot and angular leaf spot. Matures in 65–70 days.",
    },
    {
      id: 3,
      name: "Tengeru 97 Tomato",
      category: "Vegetables",
      img: "/img/seed.png",
      price: 25000,
      stock: 40,
      broker: "Nile Valley Agro-Inputs",
      description:
        "Determinate, firm-fruited variety ideal for long-distance transport. High blight tolerance.",
    },
    {
      id: 4,
      name: "Victoria Seed Potatoes",
      category: "Tubers",
      img: "/img/seed.png",
      price: 65000,
      stock: 30,
      broker: "Rwenzori Highland Growers",
      description:
        "Certified clean basic seed tubers (30kg bag), high yield potential in highland soils.",
    },
    {
      id: 5,
      name: "Kawanda Purple Passion Fruit",
      category: "Fruits",
      img: "/img/seed.png",
      price: 18000,
      stock: 60,
      broker: "Ankole Fresh Genetics",
      description:
        "Aromatic, vigorous-growing vine seeds with strong tolerance to woodiness virus.",
    },
    {
      id: 6,
      name: "Gloria F1 Cabbage",
      category: "Vegetables",
      img: "/img/seed.png",
      price: 35000,
      stock: 25,
      broker: "Nile Valley Agro-Inputs",
      description:
        "Large, dense heads (3–4kg) with long field-holding capacity and black rot resistance.",
    },
    {
      id: 7,
      name: "Golden Gooseberry (Entuutunu)",
      category: "Rare",
      img: "/img/seed.png",
      price: 45000,
      stock: 12,
      broker: "Rwenzori Highland Growers",
      description:
        "Specialty export-grade cape gooseberry seeds. High antioxidant fruit, 90-day harvest.",
    },
    {
      id: 8,
      name: "Sesim 2 White Sesame",
      category: "Grains",
      img: "/img/seed.png",
      price: 14000,
      stock: 95,
      broker: "Gulu Savannah Seeds",
      description:
        "High oil-content white simsim, shattering-tolerant pods for minimal harvest loss.",
    },
    {
      id: 9,
      name: "NASPOT 8 Orange Sweet Potato",
      category: "Tubers",
      img: "/img/seed.png",
      price: 20000,
      stock: 50,
      broker: "Ankole Fresh Genetics",
      description:
        "Beta-carotene rich vine cuttings bundle (200 vines), drought-hardy and sweet.",
    },
    {
      id: 10,
      name: "Sukari F1 Watermelon",
      category: "Fruits",
      img: "/img/seed.png",
      price: 40000,
      stock: 18,
      broker: "Nile Valley Agro-Inputs",
      description:
        "Deep red flesh, high Brix sugar content, thick rind for bruise-free market delivery.",
    },
  ];

  // Interactive States
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [brokerSort, setBrokerSort] = useState("");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [visibleSeedCount, setVisibleSeedCount] = useState(8);

  // Sync category card click & seed dropdown
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory((prev) =>
      prev === categoryName ? "All" : categoryName,
    );
    setVisibleSeedCount(8);
  };

  // Trigger search on button click or Enter key (also supports live clearing)
  const handleSearchSubmit = () => {
    setAppliedSearch(searchInput.trim());
    setVisibleSeedCount(8);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (val === "") setAppliedSearch("");
  };

  // Filter & Sort Brokers
  const filteredBrokers = useMemo(() => {
    const query = appliedSearch.toLowerCase();
    return mockBrokers
      .filter((broker) => {
        const matchesCategory =
          selectedCategory === "All" ||
          broker.categories.includes(selectedCategory);
        const matchesSearch =
          !query ||
          broker.name.toLowerCase().includes(query) ||
          broker.location.toLowerCase().includes(query) ||
          broker.description.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (brokerSort === "rating") return b.rating - a.rating;
        if (brokerSort === "location")
          return a.location.localeCompare(b.location);
        return 0;
      });
  }, [appliedSearch, selectedCategory, brokerSort]);

  // Filter Seeds
  const filteredSeeds = useMemo(() => {
    const query = appliedSearch.toLowerCase();
    return mockSeeds.filter((seed) => {
      const matchesCategory =
        selectedCategory === "All" || seed.category === selectedCategory;
      const matchesBroker = !selectedBroker || seed.broker === selectedBroker;
      const matchesSearch =
        !query ||
        seed.name.toLowerCase().includes(query) ||
        seed.broker.toLowerCase().includes(query) ||
        seed.description.toLowerCase().includes(query);
      return matchesCategory && matchesBroker && matchesSearch;
    });
  }, [appliedSearch, selectedCategory, selectedBroker]);

  const visibleSeeds = filteredSeeds.slice(0, visibleSeedCount);
  const hasMoreSeeds = visibleSeedCount < filteredSeeds.length;

  return (
    <section className="page">
      <div className="rounded-lg bg-emerald-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <PlantIcon size={16} weight="fill" />
            Good Seasons Ahead
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Certified Seeds from Verified Dealers
          </h1>
          <p className="text-sm text-emerald-100/90 max-w-xl">
            Compare germination-tested varieties by maturity window, pack size,
            and nearest pickup hub.
          </p>
        </div>
      </div>

      {/* Category Cards (Click to filter, click again to reset) */}
      <div className="flex md:grid md:grid-cols-6 gap-4 mt-6 overflow-x-auto pb-4">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => handleCategorySelect(category.name)}
            className="flex flex-col min-w-32 bg-gray-200 border-gray-300 border rounded-lg p-4 items-center text-center cursor-pointer hover:shadow-lg transition-shadow duration-300"
          >
            <img
              src={category.img}
              alt={category.name}
              className="h-10 w-10 rounded-md mb-4"
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
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            className="input filled bg-transparent focus:bg-white focus:border-transparent focus:ring-0 focus:ring-transparent"
            placeholder="Search varieties, locations, or dealers..."
          />
        </div>
        <button onClick={handleSearchSubmit} className="btn primary">
          Search
        </button>
      </div>

      {/* Dealers Section */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold mb-2">
            Dealers {selectedBroker ? `(${selectedBroker})` : ""}
          </h2>
          <select
            value={brokerSort}
            onChange={(e) => setBrokerSort(e.target.value)}
            className="input filled !w-fit bg-white border border-gray-300 rounded-lg px-2 py-1"
          >
            <option value="">Sort by</option>
            <option value="rating">Rating</option>
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
                    prev === broker.name ? null : broker.name,
                  )
                }
                className="flex w-112 h-48 bg-white border border-gray-300 rounded-lg gap-2 flex-shrink-0 cursor-pointer"
              >
                <img
                  src={broker.img}
                  alt={broker.name}
                  className="w-48 rounded-l-lg object-cover"
                />
                <div className="flex flex-col p-4 justify-between">
                  <p className="font-semibold">{broker.name}</p>
                  <div className="flex gap-2 my-2 border-b border-gray-300 pb-2">
                    <p className="text-sm text-gray-600">{broker.location}</p>
                    <p className="flex items-center text-sm text-gray-600">
                      <StarIcon
                        size={16}
                        weight="fill"
                        className="text-yellow-500 inline-block mr-1"
                      />
                      {broker.rating}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {broker.description}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {broker.categories.map((category, index) => (
                      <span
                        key={index}
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
      </div>

      {/* Seeds Section */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold mb-2">Seeds</h2>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
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
              <div
                key={seed.id}
                className="bg-white border border-gray-300 rounded-lg"
              >
                <img
                  src={seed.img}
                  alt={seed.name}
                  className="h-48 rounded-t-lg object-cover"
                />
                <div className="flex flex-col p-4">
                  <p className="font-semibold">{seed.name}</p>
                  <p className="text-sm text-emerald-600 font-bold text-xl mt-2">
                    UGX {seed.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {seed.description}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-300">
                    <p className="text-sm text-gray-600">{seed.broker}</p>
                    <p className="text-sm text-gray-600">Stock: {seed.stock}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600 col-span-full">
              No seeds found matching your criteria.
            </p>
          )}
        </div>
      </div>

      {hasMoreSeeds && (
        <button
          onClick={() => setVisibleSeedCount((prev) => prev + 4)}
          className="btn primary md:w-fit !self-center"
        >
          Load More <RepeatIcon size={16} />
        </button>
      )}
    </section>
  );
}

export default HomePage;
