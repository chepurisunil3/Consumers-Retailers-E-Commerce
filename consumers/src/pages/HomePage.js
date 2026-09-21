import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StorefrontLayout from "../components/StorefrontLayout";
import ProductCard from "../components/ProductCard";
import { consumerApi } from "../services/api";

const SLIDES = [
  {
    eyebrow: "Big Billion Days",
    title: "Up to 30% off on electronics & accessories",
    cta: "Shop electronics",
    link: "/products?categoryId=",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80",
  },
  {
    eyebrow: "New arrivals",
    title: "Refresh your wardrobe with this season's fashion",
    cta: "Shop fashion",
    link: "/products",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
  },
  {
    eyebrow: "Daily essentials",
    title: "Grocery & pharmacy, delivered to your door",
    cta: "Shop essentials",
    link: "/products",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  },
];

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [featured, setFeatured] = useState([]);
  const [discounted, setDiscounted] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      consumerApi.getProducts({ featured: "true" }),
      consumerApi.getProducts({ onDiscount: "true", sort: "discount" }),
      consumerApi.getCategories(),
    ])
      .then(([featuredRes, discountedRes, categoriesRes]) => {
        setFeatured(featuredRes.data.slice(0, 8));
        setDiscounted(discountedRes.data.slice(0, 8));
        setCategories(categoriesRes.data.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  const active = SLIDES[slide];

  return (
    <StorefrontLayout>
      <div className="carousel">
        <div>
          <span className="eyebrow">{active.eyebrow}</span>
          <h1>{active.title}</h1>
          <Link to="/products" className="btn btn-primary">{active.cta}</Link>
          <div className="carousel-dots">
            {SLIDES.map((_, i) => (
              <span key={i} className={i === slide ? "active" : ""} onClick={() => setSlide(i)} />
            ))}
          </div>
        </div>
        <img className="carousel-slide-image" src={active.image} alt="" />
      </div>

      {categories.length > 0 && (
        <>
          <div className="section-heading"><h2>Shop by category</h2></div>
          <div className="product-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {categories.map((category) => (
              <Link key={category.id} to={`/products?categoryId=${category.id}`} className="product-card" style={{ alignItems: "center", textAlign: "center" }}>
                <img className="thumb" src={category.imageUrl || "https://placehold.co/150x150"} alt={category.name} />
                <p className="name" style={{ minHeight: "auto" }}>{category.name}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {loading ? (
        <div className="empty-state">Loading products…</div>
      ) : (
        <>
          {discounted.length > 0 && (
            <>
              <div className="section-heading">
                <h2>Today's deals</h2>
                <Link to="/products?onDiscount=true">See all deals</Link>
              </div>
              <div className="product-grid">
                {discounted.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </>
          )}

          {featured.length > 0 && (
            <>
              <div className="section-heading">
                <h2>Suggested for you</h2>
                <Link to="/products">See all products</Link>
              </div>
              <div className="product-grid">
                {featured.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </>
          )}
        </>
      )}
    </StorefrontLayout>
  );
}
