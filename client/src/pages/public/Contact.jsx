import { useState } from 'react';
import { FiClock, FiMail, FiMapPin, FiPhone, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import api, { getErrorMessage } from '../../services/api';

const initialForm = { name: '', email: '', subject: '', message: '' };

const Contact = () => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/contact', form);
      toast.success(data.message);
      setForm(initialForm);
      setSent(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 py-14">
        <div className="container-page">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-300">Get in touch</p>
          <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">We would love to hear from you</h1>
          <p className="mt-3 max-w-2xl text-sm text-brand-100/80">
            Questions about an order, selling on MarketSphere, delivery partnerships or a refund? Send us a message.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          {[
            { icon: FiMail, title: 'Email us', value: 'support@marketsphere.test', hint: 'We reply within one business day' },
            { icon: FiPhone, title: 'Call support', value: '+91 90000 00000', hint: 'Mon–Sat, 9:00 AM – 7:00 PM IST' },
            { icon: FiMapPin, title: 'Marketplace office', value: 'Level 4, Commerce House, Bengaluru, India', hint: 'Visits by appointment only' },
            { icon: FiClock, title: 'Order help', value: 'Use your order details page', hint: 'Cancel, track or request a refund from there' },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.title}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.hint}</p>
              </div>
            </div>
          ))}

          <div className="rounded-2xl bg-brand-50 p-5 text-sm text-brand-800">
            <p className="font-semibold">Existing order?</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-700">
              The fastest way to resolve an issue is from the order details page. You can track the shipment,
              cancel an eligible order or submit a return/refund request.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold">Send a message</h2>
          <p className="mt-1 text-sm text-slate-500">All fields are required. Your message is stored securely in the marketplace database.</p>

          {sent && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Your message has been received. Reference support will respond by email.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="label">Full name</label>
                <input id="contact-name" name="name" required value={form.name} onChange={handleChange} className="input" placeholder="Your name" />
              </div>
              <div>
                <label htmlFor="contact-email" className="label">Email address</label>
                <input id="contact-email" name="email" type="email" required value={form.email} onChange={handleChange} className="input" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label htmlFor="contact-subject" className="label">Subject</label>
              <input id="contact-subject" name="subject" required value={form.subject} onChange={handleChange} className="input" placeholder="How can we help?" />
            </div>
            <div>
              <label htmlFor="contact-message" className="label">Message</label>
              <textarea id="contact-message" name="message" required rows={6} value={form.message} onChange={handleChange} className="input resize-none" placeholder="Tell us what happened..." />
            </div>
            <Button type="submit" loading={submitting} icon={FiSend} className="w-full sm:w-auto">
              Send message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
