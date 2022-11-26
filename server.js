const express = require('express');
const options = require("./config/dbConfig");
const {productsRouter, products} = require('./routes/products');
const handlebars = require('express-handlebars');
const {Server} = require("socket.io");
const {normalize, schema} = require("normalizr");

const Contenedor = require("./managers/contenedorProductos");
const ContenedorChat = require('./managers/contenedorChat');
const ContenedorSql = require("./managers/contenedorSql");


const productosApi = new ContenedorSql(options.mariaDB, "products");
const chatApi = new ContenedorChat("chat.txt");

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(express.static(__dirname+'/public'))

app.engine('handlebars', handlebars.engine());
app.set('views', __dirname+'/views');
app.set('view engine', 'handlebars');


const authorSchema = new schema.Entity("authors",{}, {idAttribute:"email"});

const messageSchema = new schema.Entity("messages", {author: authorSchema});

const chatSchema = new schema.Entity("chat", {
    messages:[messageSchema]
}, {idAttribute:"id"});

const normalizarData = (data)=>{
    const normalizeData = normalize({id:"chatHistory", messages:data}, chatSchema);
    return normalizeData;
};

const normalizarMensajes = async()=>{
    const results = await chatApi.getAll();
    const messagesNormalized = normalizarData(results);
    return messagesNormalized;
}
app.get('/', async(req,res)=>{
    res.render('home')
})

app.get('/productos',async(req,res)=>{
    res.render('products',{products: await productosApi.getAll()})
})

app.use('/api/products',productsRouter)

const server = app.listen(8080,()=>{
    console.log('listening on port 8080')
})

const io = new Server(server);


io.on("connection",async(socket)=>{

    io.sockets.emit("products", await productosApi.getAll())


    socket.on("newProduct",async(data)=>{
        await productosApi.save(data);

        io.sockets.emit("products", await productosApi.getAll())
    })

    io.sockets.emit("messages", await normalizarMensajes());


    socket.on("newMessage", async(newMsg)=>{
        console.log(newMsg);
        await chatApi.save(newMsg);
        io.sockets.emit("messages", await normalizarMensajes());
    });
})