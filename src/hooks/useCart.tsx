import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const previousproduct = updatedCart.find((product) => {
        return product.id === productId;
      })

      const stock = await api.get(`/stock/${productId}`);
      const stockedProducts = stock.data.amount;

      const newProductAmount = previousproduct ? previousproduct.amount : 0;

      if (newProductAmount + 1 > stockedProducts) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (previousproduct) {
        previousproduct.amount += 1

      } else {
        const APIproduct = await api.get(`/products/${productId}`);
        const product = APIproduct.data;
        product.amount = 1;
        updatedCart.push(product)
      };

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      setCart(updatedCart);

    } catch {
      toast.error('Erro na adição do produto');
      return
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productList = cart.filter(product => product.id !== productId);
      if (productList.length === cart.length) { throw Error() };

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(productList));
      setCart(productList);


    } catch {
      toast.error('Erro na remoção do produto');
      return;
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) return;

      const stock = await api.get(`/stock/${productId}`);
      const stockedProducts = stock.data;

      if (amount > stockedProducts.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];

      const productToUpdate = updatedCart.find((product) => {
        return product.id === productId
      })
      if (productToUpdate) {
        productToUpdate.amount = amount;
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        setCart(updatedCart);
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
