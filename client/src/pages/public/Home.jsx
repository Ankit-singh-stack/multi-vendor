import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiHeadphones,
  FiHeart,
  FiHome as FiHomeIcon,
  FiMonitor,
  FiPackage,
  FiShield,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from 'react-icons/fi';
import Button from '../../components/common/Button';
import ProductList from '../../components/products/ProductList';
import Loader from '../../components/common/Loader';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import { formatPrice, resolveImage } from '../../utils/formatPrice';

const iconMap = {
  Electronics: FiMonitor,
  Fashion: FiShoppingBag,
  'Home & Living': FiHomeIcon,
  Beauty: FiHeart,
  'Sports & Outdoors': FiActivity,
  'Books & Stationery': FiBookOpen,
};

const features = [
  { icon: FiTruck, title: 'Fast, tracked delivery', text: 'Every order is assigned to a verified delivery partner with live status updates.' },
  { icon: FiShield, title: 'Secure Razorpay payments', text: 'Payments are verified on the server. We never trust a success message from the browser.' },
  { icon: FiCheckCircle, title: 'Trusted sellers', text: 'Every seller is reviewed and approved by the MarketSphere marketplace team.' },
  { icon: FiHeadphones, title: 'Human support', text: 'Questions about an order, return or refund? Our support team is one message away.' },
];

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [featuredRes, trendingRes, categoriesRes] = await Promise.all([
          productService.getFeatured(),
          productService.getProducts({ sort: 'popular', limit: 8 }),
          categoryService.getCategories(),
        ]);
        if (!active) return;
        setFeatured(featuredRes.data.products || []);
        setTrending(trendingRes.data.products || []);
        setCategories((categoriesRes.data.categories || []).slice(0, 6));
      } catch (error) {
        // Sections render empty states gracefully.
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const heroProducts = featured.slice(0, 2);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="container-page relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-brand-100 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400" />
              One marketplace · Four trusted roles
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl xl:text-6xl">
              Everything you need,
              <span className="block bg-gradient-to-r from-accent-300 via-accent-400 to-amber-200 bg-clip-text text-transparent">
                from sellers you trust.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100/80 sm:text-lg">
              Discover electronics, fashion, home essentials and more from independent sellers — with secure
              payments, verified delivery partners and easy returns.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/products" size="lg" variant="amber" icon={FiShoppingBag}>
                Start shopping
              </Button>
              <Button
                to="/register?role=seller"
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                icon={FiArrowRight}
              >
                Sell on MarketSphere
              </Button>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                { value: '17+', label: 'Curated products' },
                { value: '6', label: 'Categories' },
                { value: '4.6★', label: 'Average rating' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-brand-200/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-sm" />
            <div className="relative grid grid-cols-2 gap-4 px-6 py-8">
              {heroProducts.length ? (
                heroProducts.map((product, index) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className={`group overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl transition hover:-translate-y-1 ${
                      index === 1 ? 'mt-10' : ''
                    }`}
                  >
                    <img
                      src={resolveImage(product.images?.[0]?.url)}
                      alt={product.name}
                      className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="p-4">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="mt-1 text-sm font-bold text-brand-700">{formatPrice(product.effectivePrice)}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 flex h-80 items-center justify-center rounded-3xl bg-white/10 text-sm text-white/60">
                  {loading ? 'Loading featured picks...' : 'Featured products will appear here.'}
                </div>
              )}
            </div>
            <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 shadow-2xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <FiCheckCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Verified sellers only</p>
                <p className="text-[10px] text-slate-500">Admin-reviewed storefronts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page -mt-8 relative z-10">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:grid-cols-3">
          {[
            { icon: FiTruck, title: 'Free delivery above ₹999', text: 'Per store, automatically applied' },
            { icon: FiShield, title: 'Buyer protection', text: 'Backend-verified payments' },
            { icon: FiUsers, title: 'Multi-vendor cart', text: 'Shop multiple sellers at once' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Browse the market</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Shop by category</h2>
          </div>
          <Link to="/categories" className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 sm:flex">
            All categories <FiArrowRight />
          </Link>
        </div>
        {loading ? (
          <Loader label="Loading categories..." />
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) => {
              const Icon = iconMap[cat.name] || FiPackage;
              return (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-800">{cat.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{cat.productCount || 0} products</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="container-page mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Handpicked for you</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Featured products</h2>
          </div>
          <Button to="/products" variant="outline" size="sm" icon={FiArrowRight}>
            View all
          </Button>
        </div>
        <div className="mt-6">
          <ProductList products={featured} loading={loading} emptyDescription="Featured products will appear once sellers add stock." />
        </div>
      </section>

      <section className="container-page mt-16">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-brand-900 p-8 text-white lg:col-span-2">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-brand-500/30 blur-2xl" />
            <span className="badge bg-accent-400 text-slate-900">Limited time</span>
            <h3 className="mt-4 max-w-md text-2xl font-bold text-white sm:text-3xl">Save up to 30% on top picks this week</h3>
            <p className="mt-2 max-w-md text-sm text-slate-300">
              Use code <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono font-semibold text-white">WELCOME10</span> at checkout
              for 10% off your first order.
            </p>
            <Button to="/products?sort=popular" variant="amber" className="mt-6" icon={FiArrowRight}>
              Shop best sellers
            </Button>
          </div>
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 shadow-card">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <FiShoppingBag className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-xl font-bold">Grow with MarketSphere</h3>
              <p className="mt-2 text-sm text-slate-500">
                Open your store, manage inventory and reach customers across India with transparent commissions.
              </p>
            </div>
            <Button to="/register?role=seller" variant="dark" className="mt-6" icon={FiArrowRight}>
              Become a seller
            </Button>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Popular right now</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Trending across the marketplace</h2>
          </div>
          <Link to="/products?sort=popular" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Explore best sellers
          </Link>
        </div>
        <div className="mt-6">
          <ProductList products={trending} loading={loading} />
        </div>
      </section>

      <section className="container-page mt-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card sm:p-10">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Why MarketSphere</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">A marketplace built around trust</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
              Sellers, customers and delivery partners each get a dedicated workspace, while administrators keep
              the entire marketplace safe and accountable.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
