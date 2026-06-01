"use client";
import { SectionTitle } from "@/components";
import { useProductStore } from "@/app/_zustand/store";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import PaymentQRCode from "@/components/PaymentQRCode";
import apiClient from "@/lib/api";
import { ArrowRight, BadgePercent, Banknote, CreditCard, Shield, Truck, WalletCards, X } from "lucide-react";

type AppliedVoucher = {
  code: string;
  title: string;
  discount: number;
  merchantName?: string;
};

const CheckoutPage = () => {
  const { data: session, status } = useSession();
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER" | "CARD">("BANK_TRANSFER");
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    company: "",
    address: "",
    apartment: "",
    city: "",
    country: "",
    postalCode: "",
    orderNotice: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const { products, total, clearCart } = useProductStore();
  const router = useRouter();

  const shippingAmount = 50000;
  const taxAmount = Math.round(total * 0.05);
  const discountAmount = appliedVoucher?.discount || 0;
  const finalTotal = total === 0 ? 0 : Math.max(0, total - discountAmount + taxAmount + shippingAmount);

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' VND';
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!checkoutForm.name.trim() || checkoutForm.name.trim().length < 2) {
      errors.push("First name must be at least 2 characters");
    }
    if (!checkoutForm.lastname.trim() || checkoutForm.lastname.trim().length < 2) {
      errors.push("Last name must be at least 2 characters");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(checkoutForm.email.trim())) {
      errors.push("Invalid email address");
    }
    const phoneDigits = checkoutForm.phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10) {
      errors.push("Phone number must be at least 10 digits");
    }
    if (!checkoutForm.address.trim()) {
      errors.push("Address is required");
    }
    if (!checkoutForm.city.trim()) {
      errors.push("City is required");
    }
    return errors;
  };

  const parseApiError = async (response: Response, fallback: string) => {
    try {
      const body = await response.json();
      if (Array.isArray(body.details) && body.details.length > 0) {
        return body.details.join(". ");
      }
      return body.message || body.error || body.details || fallback;
    } catch {
      return fallback;
    }
  };

  const applyVoucher = async () => {
    const normalizedCode = voucherCode.trim().toUpperCase();

    if (!normalizedCode) {
      setVoucherError("Enter a voucher code first");
      return;
    }

    if (products.length === 0) {
      setVoucherError("Your cart is empty");
      return;
    }

    setIsApplyingVoucher(true);
    setVoucherError("");

    try {
      const response = await apiClient.request("/api/vouchers/apply", {
        method: "POST",
        body: JSON.stringify({
          code: normalizedCode,
          orderTotal: total,
          cartItems: products.map((product) => ({
            productId: product.id,
            quantity: product.amount,
            price: product.price,
            unitPrice: product.price,
            merchantId: product.sellerId || product.merchantId,
            sellerId: product.sellerId || product.merchantId,
          })),
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const message = await parseApiError(response, "Voucher could not be applied");
        setAppliedVoucher(null);
        setVoucherError(message);
        toast.error(message);
        return;
      }

      const data = await response.json();
      const voucher = data?.voucher;

      if (!voucher?.code || !voucher?.discount || voucher.discount <= 0) {
        const message = "Voucher does not apply to this cart";
        setAppliedVoucher(null);
        setVoucherError(message);
        toast.error(message);
        return;
      }

      setVoucherCode(voucher.code);
      setAppliedVoucher({
        code: voucher.code,
        title: voucher.title || voucher.code,
        discount: voucher.discount,
        merchantName: voucher.merchantName,
      });
      toast.success("Voucher applied");
    } catch (error) {
      console.error("Voucher apply error:", error);
      setVoucherError("Unable to apply voucher. Please try again.");
      toast.error("Unable to apply voucher. Please try again.");
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherError("");
  };

  const makePurchase = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        toast.error(error);
      });
      return;
    }

    if (products.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (voucherCode.trim() && !appliedVoucher) {
      toast.error("Please apply or clear the voucher code before placing your order");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = products.map(p => ({
        productId: p.id,
        quantity: p.amount,
        unitPrice: p.price,
        sellerId: p.sellerId || p.merchantId || ''
      }));

      const orderData = {
        customerId: (session?.user as any)?.id,
        name: checkoutForm.name.trim(),
        lastname: checkoutForm.lastname.trim(),
        phone: checkoutForm.phone.trim(),
        email: checkoutForm.email.trim().toLowerCase(),
        company: checkoutForm.company.trim(),
        address: checkoutForm.address.trim(),
        apartment: checkoutForm.apartment.trim(),
        postalCode: checkoutForm.postalCode.trim(),
        city: checkoutForm.city.trim(),
        country: checkoutForm.country.trim(),
        orderNotice: checkoutForm.orderNotice.trim(),
        items: orderItems,
        voucherCodes: appliedVoucher ? [appliedVoucher.code] : [],
        paymentMethod,
      };

      const response = await fetch("/api/customer-orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          toast.error(errorData.error || "Failed to create order");
        } catch {
          toast.error("Failed to create order");
        }
        return;
      }

      const data = await response.json();
      const orderId = data?.order?.orderId;

      setCheckoutForm({
        name: "", lastname: "", phone: "", email: "",
        company: "", address: "", apartment: "", city: "",
        country: "", postalCode: "", orderNotice: "",
      });
      setHasPlacedOrder(true);
      removeVoucher();
      clearCart();
      toast.success(
        paymentMethod === "BANK_TRANSFER"
          ? `Order ${orderId || ""} created. Please complete the bank transfer.`
          : "Order placed successfully!"
      );
      setTimeout(() => { router.push("/account/orders"); }, 800);
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      toast.error("Please login to checkout");
      router.push("/login?callbackUrl=/checkout");
      return;
    }
    if (hasPlacedOrder) return;
    if (products.length === 0) {
      toast.error("Your cart is empty");
      router.push("/cart");
    }
  }, [hasPlacedOrder, session, status, products.length, router]);

  useEffect(() => {
    setAppliedVoucher(null);
    setVoucherError("");
  }, [products.length, total]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SectionTitle title="Checkout" path="Home | Cart | Checkout" />
      
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-cyan-50">
                <h2 className="text-lg font-semibold text-gray-800">Contact Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="name"
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({...checkoutForm, name: e.target.value})}
                    required
                    placeholder="Enter your first name"
                  />
                  <Input
                    label="Last Name"
                    name="lastname"
                    value={checkoutForm.lastname}
                    onChange={(e) => setCheckoutForm({...checkoutForm, lastname: e.target.value})}
                    required
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm({...checkoutForm, email: e.target.value})}
                    required
                    placeholder="email@example.com"
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                    required
                    placeholder="0xxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-cyan-50">
                <h2 className="text-lg font-semibold text-gray-800">Shipping Address</h2>
              </div>
              <div className="p-6 space-y-4">
                <Input
                  label="Company"
                  name="company"
                  value={checkoutForm.company}
                  onChange={(e) => setCheckoutForm({...checkoutForm, company: e.target.value})}
                  placeholder="Company name (optional)"
                />
                <Input
                  label="Address"
                  name="address"
                  value={checkoutForm.address}
                  onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}
                  required
                  placeholder="Street address"
                />
                <Input
                  label="Apartment, suite, etc."
                  name="apartment"
                  value={checkoutForm.apartment}
                  onChange={(e) => setCheckoutForm({...checkoutForm, apartment: e.target.value})}
                  placeholder="Floor, room number (optional)"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={checkoutForm.city}
                    onChange={(e) => setCheckoutForm({...checkoutForm, city: e.target.value})}
                    required
                    placeholder="Ho Chi Minh City"
                  />
                  <Input
                    label="Country"
                    name="country"
                    value={checkoutForm.country}
                    onChange={(e) => setCheckoutForm({...checkoutForm, country: e.target.value})}
                    required
                    placeholder="Vietnam"
                  />
                  <Input
                    label="Postal Code"
                    name="postalCode"
                    value={checkoutForm.postalCode}
                    onChange={(e) => setCheckoutForm({...checkoutForm, postalCode: e.target.value})}
                    placeholder="700000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Notes</label>
                  <textarea
                    value={checkoutForm.orderNotice}
                    onChange={(e) => setCheckoutForm({...checkoutForm, orderNotice: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                    rows={3}
                    placeholder="Notes for your order (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-cyan-50">
                <h2 className="text-lg font-semibold text-gray-800">Payment Method</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "BANK_TRANSFER", label: "Bank QR", icon: Banknote, description: "Scan and transfer" },
                    { value: "COD", label: "Cash on Delivery", icon: WalletCards, description: "Pay when delivered" },
                    { value: "CARD", label: "Card", icon: CreditCard, description: "Coming soon" },
                  ].map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.value;
                    const isDisabled = method.value === "CARD";

                    return (
                      <button
                        key={method.value}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setPaymentMethod(method.value as typeof paymentMethod)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500/20"
                            : "border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/40"
                        } ${isDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <Icon className={`h-5 w-5 ${isSelected ? "text-purple-700" : "text-gray-500"}`} />
                          <span className={`h-4 w-4 rounded-full border ${isSelected ? "border-purple-600 bg-purple-600" : "border-gray-300"}`} />
                        </div>
                        <p className="font-semibold text-gray-900">{method.label}</p>
                        <p className="mt-1 text-xs text-gray-500">{method.description}</p>
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === "BANK_TRANSFER" && (
                  <PaymentQRCode
                    amount={finalTotal}
                    customerName={`${checkoutForm.name} ${checkoutForm.lastname}`.trim()}
                  />
                )}

                {paymentMethod === "COD" && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                    Pay the delivery partner when your order arrives. Orders remain pending until seller confirmation.
                  </div>
                )}
              </div>
            </div>

            {/* Place Order Button */}
            <Button
              onClick={makePurchase}
              isLoading={isSubmitting}
              className="w-full py-4 text-lg"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              {paymentMethod === "BANK_TRANSFER" ? "Create Order & Pay by QR" : "Place Order"}
            </Button>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-cyan-50">
                <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
              </div>
              
              <div className="p-6">
                {/* Products */}
                <div className="space-y-4 mb-6">
                  {products.map((product) => (
                    <div key={product.id} className="flex gap-4">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={product?.image ? (product.image.startsWith('http') || product.image.startsWith('/') ? product.image : `/${product.image}`) : "/product_placeholder.jpg"}
                          alt={product?.title}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {product.amount}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                          {product?.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatPrice(product?.price || 0)}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {formatPrice((product?.price || 0) * product.amount)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Voucher */}
                <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <BadgePercent className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Voucher</h3>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={voucherCode}
                      onChange={(event) => {
                        setVoucherCode(event.target.value.toUpperCase().replace(/\s/g, ""));
                        setVoucherError("");
                      }}
                      disabled={!!appliedVoucher}
                      className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm uppercase text-gray-900 placeholder:normal-case placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:bg-gray-100"
                      placeholder="Enter voucher code"
                    />
                    {appliedVoucher ? (
                      <button
                        type="button"
                        onClick={removeVoucher}
                        aria-label="Remove voucher"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={applyVoucher}
                        isLoading={isApplyingVoucher}
                        className="h-11 px-4"
                      >
                        Apply
                      </Button>
                    )}
                  </div>

                  {appliedVoucher && (
                    <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                      <p className="font-semibold">{appliedVoucher.title}</p>
                      <p className="mt-0.5">
                        {appliedVoucher.merchantName || "Platform-wide"} discount: -{formatPrice(appliedVoucher.discount)}
                      </p>
                    </div>
                  )}

                  {voucherError && (
                    <p className="mt-2 text-sm font-medium text-red-600">{voucherError}</p>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Truck className="w-4 h-4" /> Shipping
                    </span>
                    <span className="text-gray-800">{formatPrice(shippingAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (5%)</span>
                    <span className="text-gray-800">{formatPrice(taxAmount)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Voucher discount</span>
                      <span className="font-semibold text-green-700">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-4">
                    <span className="text-lg font-semibold text-gray-800">Total</span>
                    <span className="text-xl font-bold text-purple-600">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span>Secure & Protected Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
