import { cartModel } from './models/cart.model.js';
import ProductManagerMongo from '../dao/ProductManager.mongo.js';
import dotenv from 'dotenv';

dotenv.config();
const mongoDbActive = process.env.MONGO_DB_ACTIVE;

let productManager;

mongoDbActive === 'yes'
	? (productManager = new ProductManagerMongo())
	: console.info('Base de Datos de Mongo Desactivada');

class CartManagerMongo {
	constructor() {
		this.model = cartModel;
	}
	/**
	 * Muestra el listado de carritos.
	 * Con el método lean() obtengo los datos como objetos JavaScript simples.
	 * Con el método exec() ejecuto la consulta final después de haber aplicado
	 * diferentes métodos de Mongoose al find().
	 * @returns {Array} Listado de carritos.
	 */
	async getCarts() {
		try {
			return await this.model.find().lean().exec();
		} catch (error) {
			console.error(
				`No es posible obtener los carritos.\n 
				Error: ${error}`
			);
			return;
		}
	}

	/**
	 * Busca un carrito mediante su ID y muestra su contenido.
	 * @param {String} ID del carrito
	 * @returns {Object} Carrito buscado
	 */
	async getCartById(cartID) {
		try {
			return await this.model
				.findOne({ _id: cartID })
				.populate('products.product')
				.lean()
				.exec();
		} catch (error) {
			console.error(
				`No es posible obtener el carrito.\n 
				Error: ${error}`
			);
			return;
		}
	}

	/**
	 * Crea un nuevo carrito.
	 * @param {Object} Nuevo carrito a agregar
	 * @returns {Object} Carrito agregado
	 */
	async addCart(newCart) {
		try {
			return await this.model.create(newCart);
		} catch (error) {
			console.error(
				`No es posible agregar el carrito.\n 
				Error: ${error}`
			);
			return;
		}
	}

	/**
	 * Agrega un producto a un carrito.
	 * Primero busca el producto y el carrito mediante sus IDs y los almacena
	 * en constantes. Luego verifica si el producto ya está en el carrito,
	 * previamente iguala el tipo de valor de la ID convirtiéndolos a String.
	 * Si el producto existe en el carrito, incrementa su cantidad en 1
	 * de lo contrario lo agrega. Por último actualiza el carrito en la base
	 * de datos.
	 * Con la opción {new: true} devuelve la versión actualizada del carrito
	 * luego del proceso de actualización.
	 * @param {String} ID del carrito
	 * @param {String} ID del producto
	 * @returns {Object} Carrito con productos agregados
	 */
	async addProductToCart(cartId, productId) {
		try {
			const cart = await this.getCartById(cartId);
			const product = await productManager.getProductById(productId);

			if (!product) {
				console.error('El producto no existe');
				return;
			}

			const productExist = cart.products.find(
				(item) => String(item.product) === String(productId)
			);

			if (productExist) {
				productExist.quantity++;
			} else {
				cart.products.push({ product: product._id });
			}
			const updatedCart = await this.model.findOneAndUpdate(
				{ _id: cartId },
				{ $set: { products: cart.products } },
				{ new: true }
			);
			return updatedCart;
		} catch (error) {
			console.error(
				`No es posible agregar el producto al carrito.\n 
				Error: ${error}`
			);
			return;
		}
	}

	async deleteOneProductfromCart(cartId, productId) {
		try {
			const cart = await this.getCartById(cartId);

			const productIndex = cart.products.findIndex(
				(item) => String(item.product._id) === String(productId)
			);

			if (productIndex !== -1) {
				cart.products.splice(productIndex, 1);
			} else {
				console.error('No se encontró el producto en el carrito.');
				return;
			}

			const updatedCart = await this.model.findOneAndUpdate(
				{ _id: cartId },
				{ $set: { products: cart.products } },
				{ new: true }
			);

			return updatedCart;
		} catch (error) {
			console.error(
				`No es posible eliminar el producto del carrito.\n 
				Error: ${error}`
			);
			return;
		}
	}

	async updateAllProductsOfCart(cartId, newProductList) {
		try {
			const cart = await this.getCartById(cartId);

			// Valido si se trata de un array y que el mismo no esté vacío
			if (
				!Array.isArray(newProductList.payload.docs) ||
				newProductList.payload.docs.length === 0
			) {
				console.error(
					'El nuevo listado de productos es inválido o está vacío.'
				);
				return;
			}

			// Actualizo los productos del carrito con la nueva lista
			cart.products = newProductList.payload.docs.map((product) => ({
				product: product._id,
				quantity: 1, // Asigno el valor inicial del producto, luego puede modificarse
			}));

			const updatedCart = await this.model.findOneAndUpdate(
				{ _id: cartId },
				{ $set: { products: cart.products } },
				{ new: true }
			);

			return updatedCart;
		} catch (error) {
			console.error(
				`No es posible actualizar los productos del carrito.\n 
					Error: ${error}`
			);
			return;
		}
	}

	async updateQuantityOfProduct(cartId, productId, newQuantity) {
		try {
			const cart = await this.getCartById(cartId);
			const product = await productManager.getProductById(productId);

			if (!product) {
				console.error(
					'El producto no existe o hubo un error al obtenerlo.'
				);
				return;
			}

			const productExistInCart = cart.products.find(
				(item) => String(item.product) === String(productId)
			);

			if (productExistInCart) {
				const parsedQuantity = newQuantity.quantity;

				if (!isNaN(parsedQuantity)) {
					productExistInCart.quantity = parsedQuantity;
				} else {
					console.error(
						'La cantidad proporcionada no es un número válido.'
					);
					return;
				}
			} else {
				console.error('El producto no se encuentra en el carrito.');
				return null;
			}

			const updatedCart = await this.model.findOneAndUpdate(
				{ _id: cartId },
				{ $set: { products: cart.products } },
				{ new: true }
			);
			return updatedCart;
		} catch (error) {
			console.error(
				`No es posible actualizar la cantidad del producto.\n 
				Error: ${error}`
			);
			return;
		}
	}

	async deleteAllProductsfromCart(cartId) {
		try {
			const updatedCart = await this.model.findOneAndUpdate(
				{ _id: cartId },
				{ $set: { products: [] } },
				{ new: true }
			);
			return updatedCart;
		} catch (error) {
			console.error(
				`No es posible eliminar los productos del carrito.\n 
				Error: ${error}`
			);
			return;
		}
	}
}

export default CartManagerMongo;
