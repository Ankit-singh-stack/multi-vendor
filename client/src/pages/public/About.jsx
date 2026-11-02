import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiGlobe, FiShield, FiTrendingUp, FiUsers } from 'react-icons/fi';
import Button from '../../components/common/Button';

const values = [
  {
    icon: FiUsers,
    title: 'Built for four roles',
    text: 'Customers shop, sellers manage stores, delivery partners fulfil orders and administrators keep the marketplace safe.',
  },
  {
    icon: FiShield,
    title: 'Server-side trust',
    text: 'Prices, stock, commissions and payment success are always validated on the backend — never taken from the browser.',
  },
  {
    icon: FiTrendingUp,
    title: 'Transparent economics',
    text: 'Every order records the marketplace commission, seller payable, delivery charge and settlement status.',
  },
  {
    icon: FiGlobe,
    title: 'Multi-seller by design',
    text: 'A single cart can contain products from multiple stores. Checkout splits it into seller-specific shipments under one order.',
  },
];

const About = () => (
  <div>
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 py-16">
      <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute right-10 top-0 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
      <div className="container-page relative grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-300">Our story</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
            A marketplace where every role has a real workspace.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-brand-100/80 sm:text-base">
            MarketSphere is a full-stack multi-vendor commerce platform built with the MERN stack. It brings
            independent sellers, customers, delivery partners and marketplace administrators into one coherent,
            accountable system.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button to="/products" variant="amber" size="lg" icon={FiArrowRight}>Browse the marketplace</Button>
            <Button to="/contact" size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              Talk to the team
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: '4', label: 'User roles' },
            { value: '14+', label: 'Data collections' },
            { value: '10%', label: 'Default commission' },
            { value: '100%', label: 'Backend-verified payments' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-3xl font-extrabold text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-brand-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="container-page py-14">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">What we value</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Marketplace software with real accountability</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            The platform is intentionally intermediate-level: understandable architecture, clean separation of
            client and server, reusable components and real API integration. Nothing here is a static mockup —
            every dashboard reads live data from MongoDB, and every action is authorised by role.
          </p>
          <ul className="mt-5 space-y-3">
            {['No fake money transfers — payout records are marked as manually settled.', 'Protected routes enforce role-based access across the client and API.', 'Order state changes are validated against an explicit status machine.'].map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-slate-600">
                <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-card">
          <h3 className="text-lg font-bold">How an order moves</h3>
          <ol className="mt-5 space-y-4">
            {[
              ['Customer checks out', 'Backend validates cart prices and stock, then splits the order by seller.'],
              ['Payment is verified', 'Razorpay signature is checked server-side before the order is confirmed.'],
              ['Seller prepares', 'The seller accepts, processes and marks the shipment ready for pickup.'],
              ['Delivery partner fulfils', 'Admin assigns a partner who updates pickup and delivery status.'],
              ['Settlement is tracked', 'Commission, seller payable and delivery earnings are recorded for manual settlement.'],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>

    <section className="container-page pb-16">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((value) => (
          <div key={value.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <value.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-sm font-bold text-slate-900">{value.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{value.text}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="container-page pb-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-800 to-brand-600 p-8 text-center sm:p-12">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <h2 className="relative text-2xl font-bold text-white sm:text-3xl">Ready to grow your business on MarketSphere?</h2>
        <p className="relative mx-auto mt-2 max-w-xl text-sm text-brand-100">
          Apply to become a seller, add your products and reach customers across India with transparent commissions.
        </p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <Button to="/register?role=seller" variant="amber" icon={FiArrowRight}>Apply as a seller</Button>
          <Link to="/register?role=delivery" className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            Become a delivery partner
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default About;
