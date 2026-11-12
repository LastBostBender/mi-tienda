import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "tienda-carrito-v1";

function readInitialCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function reducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const product = action.product;
      const found = state.find((item) => item.id === product.id);
      if (found) {
        return state.map((item) =>
          item.id === product.id ? { ...item, cantidad: item.cantidad + action.quantity } : item
        );
      }
      return [...state, { ...product, cantidad: action.quantity }];
    }
    case "REMOVE":
      return state.filter((item) => item.id !== action.id);
    case "SET_QUANTITY":
      return state.map((item) =>
        item.id === action.id ? { ...item, cantidad: Math.max(1, Number(action.quantity) || 1) } : item
      );
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, readInitialCart);

  useEffect(() => {
    // Guardar el estado permite recuperar el carrito después de cerrar o recargar la página.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(() => ({
    items,
    addItem: (product, quantity = 1) => dispatch({ type: "ADD", product, quantity }),
    removeItem: (id) => dispatch({ type: "REMOVE", id }),
    setQuantity: (id, quantity) => dispatch({ type: "SET_QUANTITY", id, quantity }),
    clearCart: () => dispatch({ type: "CLEAR" }),
    total: items.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
    itemCount: items.reduce((sum, item) => sum + item.cantidad, 0)
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe utilizarse dentro de CartProvider");
  return context;
}
