import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/dashboard/DashboardLayout';

import Home from './pages/public/Home';
import Products from './pages/public/Products';
import ProductDetails from './pages/public/ProductDetails';
import Categories from './pages/public/Categories';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import NotFound from './pages/public/NotFound';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import Orders from './pages/customer/Orders';
import OrderDetails from './pages/customer/OrderDetails';
import TrackOrder from './pages/customer/TrackOrder';
import Cart from './pages/customer/Cart';
import Wishlist from './pages/customer/Wishlist';
import Checkout from './pages/customer/Checkout';
import Profile from './pages/customer/Profile';
import Addresses from './pages/customer/Addresses';

import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import ProductForm from './pages/seller/ProductForm';
import SellerInventory from './pages/seller/SellerInventory';
import SellerOrders from './pages/seller/SellerOrders';
import SellerAnalytics from './pages/seller/SellerAnalytics';
import SellerCommissions from './pages/seller/SellerCommissions';
import SellerPayouts from './pages/seller/SellerPayouts';
import SellerSettings from './pages/seller/SellerSettings';
import SellerReviews from './pages/seller/SellerReviews';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSellers from './pages/admin/AdminSellers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPayments from './pages/admin/AdminPayments';
import AdminRefunds from './pages/admin/AdminRefunds';
import AdminDeliveryPartners from './pages/admin/AdminDeliveryPartners';
import AdminCommissions from './pages/admin/AdminCommissions';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminSettings from './pages/admin/AdminSettings';

import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryOrders from './pages/delivery/DeliveryOrders';
import DeliveryOrderDetails from './pages/delivery/DeliveryOrderDetails';
import DeliveryHistory from './pages/delivery/DeliveryHistory';
import DeliveryEarnings from './pages/delivery/DeliveryEarnings';
import DeliveryProfile from './pages/delivery/DeliveryProfile';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

const customer = (element) => <ProtectedRoute roles={['customer']}>{element}</ProtectedRoute>;

const App = () => (
  <AuthProvider>
    <CartProvider>
      <WishlistProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="categories" element={<Categories />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="cart" element={customer(<Cart />)} />
            <Route path="wishlist" element={customer(<Wishlist />)} />
            <Route path="checkout" element={customer(<Checkout />)} />
            <Route path="orders/:id" element={customer(<OrderDetails />)} />
            <Route path="track-order" element={customer(<TrackOrder />)} />
            <Route path="track-order/:id" element={customer(<TrackOrder />)} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={<ProtectedRoute roles={['customer']}><DashboardLayout /></ProtectedRoute>}
          >
            <Route index element={<CustomerDashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="profile" element={<Profile />} />
            <Route path="cart" element={<Navigate to="/cart" replace />} />
            <Route path="wishlist" element={<Navigate to="/wishlist" replace />} />
          </Route>
          <Route path="/orders" element={<Navigate to="/dashboard/orders" replace />} />
          <Route path="/addresses" element={<Navigate to="/dashboard/addresses" replace />} />
          <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />

          <Route
            path="/seller"
            element={<ProtectedRoute roles={['seller']}><DashboardLayout /></ProtectedRoute>}
          >
            <Route index element={<SellerDashboard />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="products/add" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="inventory" element={<SellerInventory />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="analytics" element={<SellerAnalytics />} />
            <Route path="commissions" element={<SellerCommissions />} />
            <Route path="payouts" element={<SellerPayouts />} />
            <Route path="settings" element={<SellerSettings />} />
            <Route path="reviews" element={<SellerReviews />} />
          </Route>

          <Route
            path="/admin"
            element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="sellers" element={<AdminSellers />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="refunds" element={<AdminRefunds />} />
            <Route path="delivery-partners" element={<AdminDeliveryPartners />} />
            <Route path="commissions" element={<AdminCommissions />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route
            path="/delivery"
            element={<ProtectedRoute roles={['delivery']}><DashboardLayout /></ProtectedRoute>}
          >
            <Route index element={<DeliveryDashboard />} />
            <Route path="orders" element={<DeliveryOrders />} />
            <Route path="orders/:id" element={<DeliveryOrderDetails />} />
            <Route path="history" element={<DeliveryHistory />} />
            <Route path="earnings" element={<DeliveryEarnings />} />
            <Route path="profile" element={<DeliveryProfile />} />
          </Route>
        </Routes>
      </WishlistProvider>
    </CartProvider>
  </AuthProvider>
);

export default App;
