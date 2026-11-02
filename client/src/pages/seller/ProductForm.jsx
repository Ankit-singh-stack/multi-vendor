import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiImage, FiSave, FiUploadCloud } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';
import { getErrorMessage } from '../../services/api';
import { formatPrice, resolveImage } from '../../utils/formatPrice';

const initial = {
  name: '',
  description: '',
  brand: '',
  price: '',
  discountPrice: '',
  stock: '',
  category: '',
  tags: '',
  status: 'active',
};

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(initial);
  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const requests = [categoryService.getCategories()];
    if (editing) requests.push(productService.getProduct(id));
    Promise.all(requests)
      .then(([categoryRes, productRes]) => {
        if (!active) return;
        setCategories(categoryRes.data.categories || []);
        if (productRes?.data?.product) {
          const product = productRes.data.product;
          setForm({
            name: product.name || '',
            description: product.description || '',
            brand: product.brand || '',
            price: product.price ?? '',
            discountPrice: product.discountPrice || '',
            stock: product.stock ?? '',
            category: product.category?._id || product.category || '',
            tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
            status: product.status || 'active',
          });
          setExistingImages(product.images || []);
        }
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [editing, id]);

  const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const selectFiles = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const removeExisting = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (Number(form.discountPrice) > 0 && Number(form.discountPrice) >= Number(form.price)) {
      return toast.error('Discount price must be lower than the regular price.');
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (editing) {
        payload.append('imageUrls', JSON.stringify(existingImages.map((i) => i.url).filter(Boolean)));
      }
      files.forEach((file) => payload.append('images', file));

      const { data } = editing
        ? await productService.updateProduct(id, payload)
        : await productService.createProduct(payload);
      toast.success(data.message);
      navigate('/seller/products');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Loading product..." />;

  return (
    <div className="space-y-5">
      <div>
        <Link to="/seller/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700"><FiArrowLeft /> Back to products</Link>
        <h1 className="mt-2 text-2xl font-bold">{editing ? 'Edit product' : 'Add a new product'}</h1>
        <p className="mt-1 text-sm text-slate-500">Products go live immediately when your seller account is approved.</p>
      </div>

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Product details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="name">Product name</label>
                <input id="name" name="name" required value={form.name} onChange={change} className="input" placeholder="e.g. Wireless Noise-Cancelling Headphones" />
              </div>
              <div>
                <label className="label" htmlFor="description">Description</label>
                <textarea id="description" name="description" required rows={6} value={form.description} onChange={change} className="input" placeholder="Describe the product, materials, features and what is included..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="brand">Brand</label>
                  <input id="brand" name="brand" value={form.brand} onChange={change} className="input" placeholder="Brand name" />
                </div>
                <div>
                  <label className="label" htmlFor="category">Category</label>
                  <select id="category" name="category" required value={form.category} onChange={change} className="input">
                    <option value="">Select category</option>
                    {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="tags">Tags <span className="text-slate-400">(comma separated)</span></label>
                <input id="tags" name="tags" value={form.tags} onChange={change} className="input" placeholder="wireless, audio, bluetooth" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold"><FiImage className="h-4 w-4 text-brand-600" /> Product images</h2>
            <p className="mt-1 text-xs text-slate-500">Upload up to 5 images. The first image is used as the thumbnail.</p>

            {existingImages.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current images</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {existingImages.map((image, index) => (
                    <div key={`${image.url}-${index}`} className="group relative">
                      <img src={resolveImage(image.url)} alt="Product" className="h-20 w-20 rounded-xl border border-slate-200 object-cover" onError={(e) => { e.currentTarget.src = '/images/product-placeholder.svg'; }} />
                      <button type="button" onClick={() => removeExisting(index)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
              <FiUploadCloud className="h-8 w-8 text-brand-500" />
              <span className="mt-2 text-sm font-semibold text-slate-700">Click to upload images</span>
              <span className="mt-1 text-xs text-slate-500">PNG, JPG or WebP · up to 5 files</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={selectFiles} />
            </label>

            {previews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {previews.map((src, index) => (
                  <img key={src} src={src} alt={`Preview ${index + 1}`} className="h-20 w-20 rounded-xl border border-slate-200 object-cover" />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Pricing & stock</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="price">Regular price (₹)</label>
                <input id="price" name="price" type="number" min="0" step="0.01" required value={form.price} onChange={change} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="discountPrice">Discounted price (₹) <span className="text-slate-400">(optional)</span></label>
                <input id="discountPrice" name="discountPrice" type="number" min="0" step="0.01" value={form.discountPrice} onChange={change} className="input" />
                {Number(form.discountPrice) > 0 && Number(form.price) > 0 && Number(form.discountPrice) < Number(form.price) && (
                  <p className="mt-1 text-[11px] text-emerald-600">Customers see {formatPrice(form.discountPrice)}</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="stock">Stock quantity</label>
                <input id="stock" name="stock" type="number" min="0" required value={form.stock} onChange={change} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="status">Visibility</label>
                <select id="status" name="status" value={form.status} onChange={change} className="input">
                  <option value="active">Active — visible in store</option>
                  <option value="draft">Draft — hidden</option>
                  <option value="inactive">Inactive — hidden</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="mt-5 w-full" loading={submitting} icon={FiSave}>{editing ? 'Save changes' : 'Publish product'}</Button>
          </div>

          <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
            <p className="font-semibold">Marketplace note</p>
            <p className="mt-1">The marketplace commission is deducted from the item total at checkout. You receive the seller payable amount shown in your commissions page.</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
