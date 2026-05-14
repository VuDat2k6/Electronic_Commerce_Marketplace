"use client";
import { SectionTitle } from "@/components";
import { useProductStore, ProductInCart } from "@/app/_zustand/store";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CreditCard, Truck, Shield, ArrowRight } from "lucide-react";

const CheckoutPage = () => {
  const { data: session } = useSession();
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    company: "",
    adress: "",
    apartment: "",
    city: "",
    country: "",
    postalCode: "",
    orderNotice: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { products, total, clearCart } = useProductStore();
  const router = useRouter();

  const shippingAmount = 50000;
  const taxAmount = Math.round(total * 0.05);
  const finalTotal = total === 0 ? 0 : total + taxAmount + shippingAmount;

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
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
    if (!checkoutForm.adress.trim()) {
      errors.push("Address is required");
    }
    if (!checkoutForm.city.trim()) {
      errors.push("City is required");
    }
    return errors;
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

    setIsSubmitting(true);

    try {
      let userId = null;
      if (session?.user?.email) {
        try {
          const userResponse = await apiClient.get(`/api/users/email/${session.user.email}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userId = userData.id;
          }
        } catch (e) {
          console.error("Error getting user:", e);
        }
      }
      
      const orderData = {
        name: checkoutForm.name.trim(),
        lastname: checkoutForm.lastname.trim(),
        phone: checkoutForm.phone.trim(),
        email: checkoutForm.email.trim().toLowerCase(),
        company: checkoutForm.company.trim(),
        adress: checkoutForm.adress.trim(),
        apartment: checkoutForm.apartment.trim(),
        postalCode: checkoutForm.postalCode.trim(),
        status: "pending",
        total: finalTotal,
        city: checkoutForm.city.trim(),
        country: checkoutForm.country.trim(),
        orderNotice: checkoutForm.orderNotice.trim(),
        userId: userId
      };

      const response = await apiClient.post("/api/orders", orderData);

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
      const orderId: string = data.id;

      // Use bulk endpoint to create all order items in a single request
      // This avoids N+1 API calls and improves performance significantly
      const orderItems = products.map(p => ({
        productId: p.id,
        quantity: p.amount,
        unitPrice: p.price,
        sellerId: p.sellerId || p.merchantId || ''
      }));

      const orderItemsResponse = await apiClient.post("/api/order-product/bulk", {
        orderId,
        items: orderItems
      });

      if (!orderItemsResponse.ok) {
        console.error("Error creating order items:", await orderItemsResponse.text());
        // Order was created but items failed - log error but don't fail
      }

      setCheckoutForm({
        name: "", lastname: "", phone: "", email: "",
        company: "", adress: "", apartment: "", city: "",
        country: "", postalCode: "", orderNotice: "",
      });
      clearCart();
      toast.success("Order placed successfully!");
      setTimeout(() => { router.push("/"); }, 1500);
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (products.length === 0) {
      toast.error("Your cart is empty");
      router.push("/cart");
    }
  }, []);

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
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({...checkoutForm, name: e.target.value})}
                    required
                    placeholder="Enter your first name"
                  />
                  <Input
                    label="Last Name"
                    value={checkoutForm.lastname}
                    onChange={(e) => setCheckoutForm({...checkoutForm, lastname: e.target.value})}
                    required
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm({...checkoutForm, email: e.target.value})}
                    required
                    placeholder="email@example.com"
                  />
                  <Input
                    label="Phone Number"
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
                  value={checkoutForm.company}
                  onChange={(e) => setCheckoutForm({...checkoutForm, company: e.target.value})}
                  placeholder="Company name (optional)"
                />
                <Input
                  label="Address"
                  value={checkoutForm.adress}
                  onChange={(e) => setCheckoutForm({...checkoutForm, adress: e.target.value})}
                  required
                  placeholder="Street address"
                />
                <Input
                  label="Apartment, suite, etc."
                  value={checkoutForm.apartment}
                  onChange={(e) => setCheckoutForm({...checkoutForm, apartment: e.target.value})}
                  placeholder="Floor, room number (optional)"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    value={checkoutForm.city}
                    onChange={(e) => setCheckoutForm({...checkoutForm, city: e.target.value})}
                    required
                    placeholder="Ho Chi Minh City"
                  />
                  <Input
                    label="Country"
                    value={checkoutForm.country}
                    onChange={(e) => setCheckoutForm({...checkoutForm, country: e.target.value})}
                    required
                    placeholder="Vietnam"
                  />
                  <Input
                    label="Postal Code"
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

            {/* Payment Notice */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Payment Information</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Payment will be processed after the order is confirmed. You will be contacted to provide payment information.
                  </p>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <Button
              onClick={makePurchase}
              isLoading={isSubmitting}
              className="w-full py-4 text-lg"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Place Order
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
                          src={product?.image ? `/${product?.image}` : "/product_placeholder.jpg"}
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
