require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const backupRoutes = require('./backupRoutes'); // Importar las rutas de respaldo
const net = require('net');

// Crear la aplicación Express
const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Conectar a MongoDB Atlas
const uri = 'mongodb+srv://carlos123:carlos123@cluster0.zldjw7s.mongodb.net/smartstep?retryWrites=true&w=majority&ssl=true';
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false
  })
  .then(() => console.log('MongoDB database connection established successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Definir el esquema y modelo de usuario
const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  sessionActive: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Funciones de cifrado y descifrado
function encryptPassword(password) {
  const shift = 5;
  let encrypted = '';
  for (let i = 0; i < password.length; i++) {
    let charCode = password.charCodeAt(i);
    if (charCode >= 65 && charCode <= 90) {
      charCode = ((charCode - 65 + shift) % 26) + 65;
    } else if (charCode >= 97 && charCode <= 122) {
      charCode = ((charCode - 97 + shift) % 26) + 97;
    }
    encrypted += String.fromCharCode(charCode);
  }
  return encrypted;
}

function decryptPassword(encryptedPassword) {
  const shift = 5;
  let decrypted = '';
  for (let i = 0; i < encryptedPassword.length; i++) {
    let charCode = encryptedPassword.charCodeAt(i);
    if (charCode >= 65 && charCode <= 90) {
      charCode = ((charCode - 65 - shift + 26) % 26) + 65;
    } else if (charCode >= 97 && charCode <= 122) {
      charCode = ((charCode - 97 - shift + 26) % 26) + 97;
    }
    decrypted += String.fromCharCode(charCode);
  }
  return decrypted;
}

// Rutas
app.post('/register', async (req, res) => {
  const { nombre, apellido, email, password } = req.body;
  try {
    const encryptedPassword = encryptPassword(password);
    const newUser = new User({ nombre, apellido, email, password: encryptedPassword });
    await newUser.save();
    res.status(201).json({
      message: 'User registered successfully',
      id_usuario: newUser._id,
      name: newUser.nombre
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || decryptPassword(user.password) !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    user.sessionActive = true;
    await user.save();
    res.status(200).json({
      message: 'Login successful',
      id_usuario: user._id,
      name: user.nombre,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/logout', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    user.sessionActive = false;
    await user.save();
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const encryptedPassword = encryptPassword(newPassword);
    const result = await User.updateOne({ email }, { $set: { password: encryptedPassword } });
    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Password reset successful' });
    } else {
      res.status(400).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.use('/admin', backupRoutes);

// Función para encontrar un puerto disponible
function findAvailablePort(port, callback) {
  const server = net.createServer();
  server.listen(port, () => {
    server.close(() => callback(port));
  });
  server.on('error', () => {
    findAvailablePort(port + 1, callback); // Incrementar el puerto si está en uso
  });
}

// Iniciar el servidor en un puerto disponible
findAvailablePort(port, (availablePort) => {
  app.listen(availablePort, () => {
    console.log(`Servidor corriendo en el puerto ${availablePort}`);
  });
});
