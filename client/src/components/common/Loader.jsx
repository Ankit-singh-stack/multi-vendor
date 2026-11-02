import { FiLoader } from 'react-icons/fi';

const Loader = ({ label = 'Loading...', fullPage = false, size = 'md', className = '' }) => {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-slate-500 ${
        fullPage ? 'min-h-[60vh]' : 'py-10'
      } ${className}`}
    >
      <FiLoader className={`animate-spin text-brand-600 ${sizes[size]}`} />
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  );
};

export default Loader;
