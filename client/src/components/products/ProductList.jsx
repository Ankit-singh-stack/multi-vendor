import ProductCard from './ProductCard';
import EmptyState from '../common/EmptyState';
import { FiPackage } from 'react-icons/fi';

const Skeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="aspect-[4/3] animate-pulse bg-slate-100" />
    <div className="space-y-3 p-4">
      <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100" />
      <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
      <div className="flex justify-between pt-2">
        <div className="h-5 w-20 animate-pulse rounded bg-slate-100" />
        <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  </div>
);

const ProductList = ({ products = [], loading = false, emptyTitle = 'No products found', emptyDescription = 'Try adjusting your filters or search terms.' }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return <EmptyState icon={FiPackage} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;
