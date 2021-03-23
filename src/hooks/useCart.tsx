import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
		const storagedCart = localStorage.getItem('@RocketShoes:cart');

		if (storagedCart) {
			return JSON.parse(storagedCart);
		}

		return [];
	});

	const addProduct = async (productId: number) => {
		try {
			const {
				data: { amount },
			} = await api.get(`/stock/${productId}`);

			if (cart.length !== 0) {
				const product = cart.find(p => p.id === productId);

				if (product && product.amount < amount) {
					const updated = cart.map(product =>
						product.id === productId ? { ...product, amount: product.amount + 1 } : product
					);
					localStorage.setItem('@RocketShoes:cart', JSON.stringify(updated));
					setCart(updated);
				} else {
					toast.error('Quantidade solicitada fora de estoque');
				}
			} else {
				const {
					data: { title, price, image },
				} = await api.get(`/products/${productId}`);

				const updated = [...cart, { id: productId, title, price, image, amount: 1 }];

				localStorage.setItem('@RocketShoes:cart', JSON.stringify(updated));
				setCart(updated);
			}
		} catch (error) {
			toast.error('Erro na adição do produto');
		}
	};

	const removeProduct = (productId: number) => {
		try {
			const product = cart.find(p => p.id === productId);

			if (product && product.amount > 1) {
				const updated = cart.map(product =>
					product.id === productId ? { ...product, amount: product.amount - 1 } : product
				);
			}
		} catch {
			toast.error('Erro na remoção do produto');
		}
	};

	const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
		try {
			// TODO
		} catch {
			// TODO
		}
	};

	return (
		<CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
			{children}
		</CartContext.Provider>
	);
}

export function useCart(): CartContextData {
	const context = useContext(CartContext);

	return context;
}
