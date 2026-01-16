import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { UpdateNotification } from "@/components/notifications/UpdateNotification";
import { UpdateBanner } from "@/components/notifications/UpdateBanner";
import { CustomerOrderNotifications } from "@/components/notifications/CustomerOrderNotifications";
import { AppFooter } from "@/components/layout/AppFooter";

// Import main pages directly for instant load
import Landing from "./pages/Landing";
import Index from "./pages/Index";
// Lazy load secondary pages for better performance
const ProviderStore = lazy(() => import("./pages/ProviderStore"));
const Cart = lazy(() => import("./pages/Cart"));
const Orders = lazy(() => import("./pages/Orders"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminForgotPassword = lazy(() => import("./pages/AdminForgotPassword"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const LoyaltyTiers = lazy(() => import("./pages/LoyaltyTiers"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const ProviderLogin = lazy(() => import("./pages/ProviderLogin"));
const ProviderDashboard = lazy(() => import("./pages/ProviderDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Install = lazy(() => import("./pages/Install"));
const Changelog = lazy(() => import("./pages/Changelog"));
const ProviderRegister = lazy(() => import("./pages/ProviderRegister"));
const EdfaPayGuide = lazy(() => import("./pages/EdfaPayGuide"));
const Favorites = lazy(() => import("./pages/Favorites"));
const MyStoreOrders = lazy(() => import("./pages/MyStoreOrders"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const WhyAlHay = lazy(() => import("./pages/WhyAlHay"));

const queryClient = new QueryClient();

// Page loading fallback - minimal spinner
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Quick loading - just wait for fonts and initial render
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <LocationProvider>
              <TooltipProvider>
                <LoadingScreen isLoading={isLoading} />
                <UpdateBanner />
                <CustomerOrderNotifications />
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/app" element={<Index />} />
                      <Route path="/product/:productId" element={<ProductDetails />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/loyalty" element={<LoyaltyTiers />} />
                      <Route path="/favorites" element={<Favorites />} />
                      <Route path="/my-store-orders" element={<MyStoreOrders />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/admin-login" element={<AdminLogin />} />
                      <Route path="/admin-forgot-password" element={<AdminForgotPassword />} />
                      <Route path="/payment-result" element={<PaymentResult />} />
                      <Route path="/provider-login" element={<ProviderLogin />} />
                      <Route path="/provider-register" element={<ProviderRegister />} />
                      <Route path="/edfapay-guide" element={<EdfaPayGuide />} />
                      <Route path="/provider-dashboard" element={<ProviderDashboard />} />
                      <Route path="/store/:providerId" element={<ProviderStore />} />
                      <Route path="/install" element={<Install />} />
                      <Route path="/changelog" element={<Changelog />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/why" element={<WhyAlHay />} />
                      {/* Redirect old routes to home */}
                      <Route path="/for-providers" element={<Landing />} />
                      <Route path="/welcome" element={<Landing />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <AppFooter />
                </BrowserRouter>
              </TooltipProvider>
            </LocationProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
