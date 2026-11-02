import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import OrderCard from '../../components/orders/OrderCard';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import orderService from '../../services/orderService';
import { getErrorMessage } from '../../services/api';
import { cn } from '../../utils/classNames';

const filters = ['all', 'Pending', 'Confirmed', 'Processing', 'Ready for Pickup', 'Assigned', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'];

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    let active = true;
    setLoading(true);
    orderService
      .getMyOrders({ status, page, limit: 8 })
      .then(({ data }) => {
        if (!active) return;
        setOrders(data.orders || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status, page]);

  const changeFilter = (next) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My orders</h1>
          <p className="mt-1 text-sm text-slate-500">{pagination.total} order(s) placed on MarketSphere</p>
        </div>
        <Button to="/products" variant="outline" size="sm">Continue shopping</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => changeFilter(item)}
            className={cn(
              'whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition',
              status === item ? 'bg-brand-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            {item === 'all' ? 'All orders' : item}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader label="Loading orders..." />
      ) : orders.length ? (
        <>
          <div className="space-y-4">
            {orders.map((order) => <OrderCard key={order._id} order={order} />)}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} className="pt-4" />
        </>
      ) : (
        <EmptyState
          icon={FiPackage}
          title="No orders found"
          description={status === 'all' ? 'Place your first order to see it here.' : `No orders with status "${status}".`}
          action={<Button to="/products" onClick={() => navigate('/products')}>Browse products</Button>}
        />
      )}
    </div>
  );
};

export default Orders;
