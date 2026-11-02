import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiArrowRight,
  FiBookOpen,
  FiHeart,
  FiHome,
  FiMonitor,
  FiPackage,
  FiShoppingBag,
} from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import categoryService from '../../services/categoryService';
import { resolveImage } from '../../utils/formatPrice';

const iconMap = {
  Electronics: FiMonitor,
  Fashion: FiShoppingBag,
  'Home & Living': FiHome,
  Beauty: FiHeart,
  'Sports & Outdoors': FiActivity,
  'Books & Stationery': FiBookOpen,
};

const gradients = [
  'from-indigo-500 to-brand-700',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-700',
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService
      .getCategories()
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 py-14">
        <div className="absolute -right-10 top-0 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="container-page relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-300">Explore MarketSphere</p>
          <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">Find your next favourite thing</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-100/80">
            Browse every department in the marketplace. Each category contains products from independent,
            admin-approved sellers.
          </p>
        </div>
      </section>

      <div className="container-page py-10">
        {loading ? (
          <Loader label="Loading categories..." />
        ) : categories.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const Icon = iconMap[category.name] || FiPackage;
              return (
                <Link
                  key={category._id}
                  to={`/products?category=${category.slug}`}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${gradients[index % gradients.length]}`}>
                    {category.image?.url ? (
                      <img
                        src={resolveImage(category.image.url)}
                        alt={category.name}
                        className="h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <>
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                        <div className="absolute bottom-3 right-4 h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm" />
                        <Icon className="absolute bottom-5 left-5 h-12 w-12 text-white/80" />
                      </>
                    )}
                    <span className="absolute right-4 top-4 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      {category.productCount || 0} products
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h2 className="text-base font-semibold text-slate-900">{category.name}</h2>
                          <p className="text-xs text-slate-500">{category.description || 'Explore products'}</p>
                        </div>
                      </div>
                      <FiArrowRight className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No categories yet"
            description="An administrator needs to create categories before products can be listed."
          />
        )}
      </div>
    </div>
  );
};

export default Categories;
