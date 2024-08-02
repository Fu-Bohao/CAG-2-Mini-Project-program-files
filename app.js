const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const app = express();
// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// Create MySQL connection
const connection = mysql.createConnection({
    //host: 'localhost',
    //user: 'root',
    //password: '',
    //database: 'c237_ca2_project_database'
    host: 'sql.freedb.tech',
    user: 'freedb_bohao',
    password: '!Nm&%@QQG*xPz27',
    database: 'freedb_ca2project'
});
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});
// Set up view engine
app.set('view engine', 'ejs');
// enable static files
app.use(express.static('public'));
// enable form processing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// Define routes

app.get('/login', (req, res) => {
    res.render('login', { error: false });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM account WHERE username = ?';
    connection.query(query, [username], (err, results) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).send('An error occurred during login');
        }
        if (results.length === 0) {
            return res.render('login', { error: true });
        }
        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Password comparison error:', err);
                return res.status(500).send('An error occurred during password comparison');
            }
            if (!isMatch) {
                return res.render('login', { error: true });
            }
            // Redirect to /home with the user's ID 
            res.redirect(`/index/${user.accountId}`);
        });
    });
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    const sql = 'INSERT INTO account (username, password, email) VALUES (?, ?, ?)';
    connection.query(sql, [username, hashedPassword, email], (error, results) => {
        if (error) {
            console.error('Error registering user:', error);
            res.status(500).send('Error registering user');
        } else {
            // Redirect to /home with the new user's ID 
            res.redirect(`/index/${results.insertId}`);
        }
    });
});

app.get('/', (req, res) => {
    const sql = "SELECT * FROM product";
    // Fetch data from MySQL
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database quesry error:', error.message);
            return res.status(500).send('Error Retrieving Products');
        }
        // Render HTML page with data
        res.render('index', { product: results });
    });
});

app.get('/cart', (req, res) => {
    const sql = "SELECT * FROM product";
    // Fetch data from MySQL
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database quesry error:', error.message);
            return res.status(500).send('Error Retrieving Products');
        }
        // Render HTML page with data
        res.render('cart', { product: results });
    });
});

app.get('/search', (req, res) => {
    const sql = "SELECT * FROM product";
    // Fetch data from MySQL
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving Products');
        }
        // Render HTML page with data
        res.render('search', { product: results });
    });
});

app.get('/product/:id', (req, res) => {
    //Extract the product ID from the request parameters
    const productId = req.params.id;
    const sql = "SELECT * FROM product WHERE productId = ?";
    // Fetch data from MySQL based on the product ID
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving Product by ID');
        }
        // Check if any product with the given ID was found
        if (results.length > 0) {
            // Render HTML page with product data
            res.render('product', { product: results[0] });
        } else {
            res.status(404).send('Product Not Found');
        }
    });
});

app.get('/search', (req, res) => {
    res.render('search');
});

app.get('/category', (req, res) => {
    res.render('category');
});

app.get('/addProduct', (req, res) => {
    res.render('addProduct');
});

app.post('/addProduct', upload.single('image'), (req, res) => {
    //Extract product data from the request body
    const { name, productQuantity, productPrice } = req.body;
    let image;
    if (req.file) {
        image = req.file.originalname;
    } else {
        image = null;
    }
    const sql = 'INSERT INTO product (productName, productQuantity, productPrice, productImage, productDescription) VALUES (?, ?, ?, ?, ?)';
    // Insert the new product into the database
    connection.query(sql, [name, productQuantity, productPrice, productImage, productDescription], (error, results) => {
        if (error) {
            console.error("Error adding product:", error);
            return res.status(500).send('Error Adding Product');
        } else {
            // send a success response
            const successResponse =
                `<div class="container mt-3">
                    <div class="alert alert-success">
                        <strong>Successfully added the product!</strong> Click <a href="/" class="alert-link">here</a> to return to home.
                    </div>
                </div>`;
            res.send(successResponse);
        }
    });
});

app.get('/editProduct/:id', (req, res) => {
    const productId = req.params.id;
    const sql = "SELECT * FROM product WHERE productId = ?";
    // Fetch data from MySQL based on the product ID
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving Product by ID');
        }
        // Check if any product with the given ID was found
        if (results.length > 0) {
            // Render HTML page with product data
            res.render('editProduct', { product: results[0] });
        } else {
            res.status(404).send('Product Not Found');
        }
    });
});

app.post('/editProduct/:id', upload.single('productImage'), (req, res) => {
    const productId = req.params.id;
    // Extract product data from the request body
    const { name, productQuantity, productPrice, productDescription } = req.body;
    let productImage = req.body.currentImage;
    if (req.file) {
        productImage = req.file.filename;
    } else {
        productImage = null;
    }

    const sql = 'UPDATE product SET productName = ? , productQuantity = ?, productPrice = ?, productImage = ?, productDescription = ? WHERE productId = ?';

    // Insert the new product into the database
    connection.query(sql, [name, productQuantity, productPrice, productImage, productDescription, productId], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error updating product:", error);
            res.status(500).send('Error updating product');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

app.get('/deleteProduct/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'DELETE FROM product WHERE productId = ?';
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error deleting product:", error);
            res.status(500).send('Error deleting product');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
