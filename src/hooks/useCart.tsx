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

	const updateCartAndLocalStorage = (updated: Product[]) => {
		localStorage.setItem('@RocketShoes:cart', JSON.stringify(updated));
		setCart(updated);
	};

	const addFirstProduct = async (productId: number) => {
		const {
			data: { title, price, image },
		} = await api.get(`/products/${productId}`);

		const updated = [...cart, { id: productId, title, price, image, amount: 1 }];

		updateCartAndLocalStorage(updated);
	};

	const addProduct = async (productId: number) => {
		try {
			const {
				data: { amount },
			} = await api.get(`/stock/${productId}`);

			const product = cart.find(p => p.id === productId);

			if (!product) {
				addFirstProduct(productId);
				return;
			}
			//o '!' is to tell the compiler that it is definetly defined
			const isProductInStock = product!.amount < amount;

			if (isProductInStock) {
				const updated = cart.map(product =>
					product.id === productId ? { ...product, amount: product.amount + 1 } : product
				);

				updateCartAndLocalStorage(updated);
			} else {
				toast.error('Quantidade solicitada fora de estoque');
			}
		} catch (error) {
			toast.error('Erro na adição do produto');
		}
	};

	const removeProduct = (productId: number) => {
		try {
			const product = cart.find(p => p.id === productId);

			if (product) {
				const updated = cart.filter(product => product.id !== productId);

				updateCartAndLocalStorage(updated);
				return;
			}

			toast.error('Erro na remoção do produto');
		} catch {
			toast.error('Erro na remoção do produto');
		}
	};

	const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
		try {
			if (amount <= 0) return;

			const product = cart.find(p => p.id === productId);

			if (!product) {
				toast.error('Erro na alteração de quantidade do produto');
				return;
			}

			const response = await api.get(`/stock/${productId}`);

			const isProductInStock = amount <= response.data.amount;

			if (isProductInStock) {
				const updated = cart.map(product =>
					product.id === productId ? { ...product, amount: product.amount + 1 } : product
				);

				updateCartAndLocalStorage(updated);
				return;
			}

			toast.error('Quantidade solicitada fora de estoque');
		} catch {
			toast.error('Erro na alteração de quantidade do produto');
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
