import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCompass } from 'react-icons/fi';
import Button from '../../components/common/Button';

const NotFound = () => (
  <div className="container-page flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
    <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-600">
      <FiCompass className="h-10 w-10" />
    </span>
    <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-brand-600">404</p>
    <h1 className="mt-2 text-3xl font-bold text-slate-900">This page wandered off</h1>
    <p className="mt-2 max-w-md text-sm text-slate-500">
      The page you are looking for doesn&apos;t exist, was moved, or the link may be incorrect.
    </p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Button to="/" icon={FiArrowLeft}>Back to store</Button>
      <Button to="/products" variant="outline">Browse products</Button>
    </div>
    <p className="mt-6 text-xs text-slate-400">
      Need help? <Link to="/contact" className="font-semibold text-brand-700 hover:underline">Contact support</Link>
    </p>
  </div>
);

export default NotFound;
