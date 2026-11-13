import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ThanksPage from "./pages/ThanksPage";
import AdminPage from "./pages/AdminPage";
export default function App(){return <><Header/><main className="container main-content"><Routes><Route path="/" element={<CatalogPage/>}/><Route path="/producto/:id" element={<ProductPage/>}/><Route path="/carrito" element={<CartPage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/gracias" element={<ThanksPage/>}/><Route path="/admin" element={<AdminPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></main><footer className="site-footer">Catálogo y pedidos · Mi Tienda</footer></>;}
