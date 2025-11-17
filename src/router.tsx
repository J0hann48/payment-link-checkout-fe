import { Navigate, createBrowserRouter } from "react-router-dom";
import { CheckoutPage } from "./pages/CheckoutPage";
import { MerchantPage } from "./pages/MerchantPage";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <MerchantPage />,
  },
  {
    path: "/checkout/:slug",
    element: <CheckoutPage />,
  },
  {
    path: "/merchant",
    element: <MerchantPage />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
