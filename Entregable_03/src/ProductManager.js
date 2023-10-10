import fs from 'fs';

class ProductManager {
	/**
	 * Crea el archivo una vez que el usuario proporciona la ubicación
	 * del archivo en la instancia.
	 */
	constructor(path) {
		this.path = path;
		if (!this.path) fs.writeFileSync(this.path, JSON.stringify([]));
	}

	/**
	 * Lee el contenido del archivo donde se encuentra la lista de productos
	 * y lo retorna como un Array
	 * @returns {Array} Listado de productos
	 */
	async getProducts() {
		try {
			const productList = await fs.promises.readFile(this.path, 'utf-8');
			return JSON.parse(productList);
		} catch (err) {
			console.error(
				`No es posible leer el archivo.\n 
            Error: ${err}`
			);
			return;
		}
	}

	/**
	 * Busca un producto mediante su ID. Para ello trae el listado de productos
	 * con el método getProducts, luego busca en el listado con el método find
	 * el producto seleccionado y si lo encuentra lo devuelve como un objeto.
	 * @param {Number} ID del producto a buscar
	 * @returns {Object} Producto buscado
	 */
	async getProductById(productID) {
		try {
			const productList = await this.getProducts();

			const productSearch = productList.find(
				(prod) => prod.id === productID
			);

			if (productSearch) {
				console.info('Producto encontrado!');
				return productSearch;
			} else {
				console.error(`ID ${productID} not found`);
				return;
			}
		} catch {
			console.error(
				`No es posible agregar el producto. \n 
            Error: ${err}`
			);
			return;
		}
	}

	/**
	 * Permite autoincrementar la ID del último producto agregado para poder
	 * asignarsela a un nuevo producto. Para ello obtiene el listado de productos,
	 * luego almacena en una constante el último producto agregado y finalmente
	 * incrementa en 1 su ID y la devuelve en forma de número para un nuevo producto.
	 * @returns {number} Nueva ID
	 */
	#getNewID = async () => {
		try {
			const productList = await this.getProducts();
			if (productList.length === 0) return 1;
			const lastProductAdd = productList[productList.length - 1];
			return lastProductAdd.id + 1;
		} catch (err) {
			console.error(
				`No es posible asignar una nueva ID.\n 
        Error: ${err}`
			);
			return;
		}
	};

	/**
	 * Primero realiza las validaciones para que todos los campos sean
	 * obligatorios, después trae el listado de productos, luego valida que no
	 * se repita el atributo code. Genera la id mediante el método privado
	 * #getNewID, pushea el nuevo producto al array que contiene el listado de
	 * productos y actualiza el archivo con la nueva información. Finalmente le
	 * informa al usuario el resultado y retorna el nuevo producto.
	 * @param {Object} Nuevo producto a agregar
	 * @returns {Object} Producto agregado
	 */
	async addProduct(newProduct) {
		try {
			const { title, description, price, thumbnail, code, stock } =
				newProduct;

			if (!title || !description || !price || !thumbnail || !code || !stock)
				return console.error('Todos los campos son obligatorios');

			const productList = await this.getProducts();

			if (productList.some((product) => product.code === code))
				return console.error(
					`El código ${code} ya existe. Intente con otro código`
				);

			const id = await this.#getNewID();

			productList.push({
				id,
				title,
				description,
				price,
				thumbnail,
				code,
				stock,
			});

			await fs.promises.writeFile(this.path, JSON.stringify(productList));

			console.info(`El producto ${title} fue agregado satisfactoriamente`);

			return productList[id - 1];
		} catch (err) {
			console.error(
				`No es posible agregar el producto. \n 
                Error: ${err}`
			);
			return;
		}
	}

	/**
	 * Elimina el producto que le indiquemos mediante su ID. Para ello obtiene
	 * el listado de productos, genera una nueva lista (con el método filter)
	 * sin el producto a eliminar y finalmente sobreescribe el archivo con la
	 * nueva lista.
	 * @param {number} ID del producto a eliminar
	 * @returns {Array} Lista de productos sin el producto eliminado
	 */
	async deleteProduct(productID) {
		const productList = await this.getProducts();
		const newProductList = productList.filter(
			(product) => product.id != productID
		);
		await fs.promises.writeFile(this.path, JSON.stringify(newProductList));
		console.info(`El producto con la ID ${productID} fue eliminado`);
		return newProductList;
	}

	/**
	 * Permite actualizar las características (atributos) de un producto. Primero
	 * desestructura el objeto para facilitar el acceso a sus propiedades. Luego
	 * obtengo el listado de productos, después recorro este listado con el método
	 * map para generar un nuevo listado con el producto actualizado. Dentro del
	 * map incluyo un condicional (if). Si encuentra el producto lo retorna
	 * con los campos modificados y si no lo hace, retorna el mismo producto sin
	 * modificaciones. Finalmente sobreescribe el archivo con la nueva lista.
	 * @param {number} ID del producto a actualizar
	 * @param {Object} Producto con los campos actualizados
	 * @returns {Array} Lista de productos actualizada
	 */
	async updateProduct(productID, productToChanged) {
		try {
			const { title, description, price, thumbnail, code, stock } =
				productToChanged;
			const productList = await this.getProducts();

			const updatedProductList = productList.map((product) => {
				if (product.id === productID) {
					return {
						...product,
						title,
						description,
						price,
						thumbnail,
						code,
						stock,
					};
				} else {
					return product;
				}
			});

			await fs.promises.writeFile(
				this.path,
				JSON.stringify(updatedProductList)
			);

			console.info(`El producto con ID ${productID} fue actualizado`);
			return updatedProductList;
		} catch (err) {
			console.error(
				`No es posible actualizar el producto. \n 
	Error: ${err}`
			);
			return;
		}
	}
}

//Creo una instancia de la clase
export const productManager = new ProductManager('./src/products.json');
