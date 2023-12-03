const express = require('express');
require('dotenv').config()
const app = express();
const PORT = 1000;
const MongoClient = require('mongodb').MongoClient
let connectionString = process.env.CONNECTING_STRING
let db;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }))
app.use(express.json());

MongoClient.connect(connectionString, { useUnifiedTopology: true })
    .then(client => {
        console.log('connected to database');
        db = client.db('users');
    });

app.get('/', (req, res) => {
    res.render('pages/welcome.ejs', {})
})

app.get('/getStarted', (req, res) => {
    try {
        res.render('pages/signup.ejs', {});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

app.get('/todos', (req, res) => {

})
app.post('/welcomeBack', (req, res) => {
    try { res.render('pages/login.ejs') }
    catch (error) {
        res.status(500).send('Internal server Error')
    }
})

app.post('/login', async (req, res) => {
    let user = await db.collection('users').findOne({ email: req.body.email });
    console.log(req.body.password, user.password, req.body.password === user.password)
    console.log(user);
    if (req.body.password !== user.password) {
        res.json({
            err: "incorrect password"
        })
    }
    userTodos = user.todos;
    console.log(userTodos, 'user todos');
    res.render('pages/home.ejs', { data: userTodos, user: user });
})

app.get('/login', (req, res) => {
    res.render('pages/login')
})

app.post('/signup', async (req, res) => {
    let registeredUsers = await db.collection('users').find().toArray();
    registeredUsers = registeredUsers.map(x => x.email);
    if (registeredUsers.includes(req.body.email)) {
        res.render('pages/login2')
    }
    else {
        const result = await db.collection('users').insertOne({ email: req.body.email, password: req.body.password, todos: [] });
        const user = await db.collection('users').findOne({ email: req.body.email });
        userTodos = user.todos;
        console.log(userTodos);
        res.render('pages/home.ejs', { user: user });
    }
})

app.put('/addtodo', async (req, res) => {
    console.log(req.body);
    const user = await db.collection('users').findOne({ email: req.body.email });
    console.log(user)
    let userTodos = user.todos
    console.log(userTodos, 'user todo')
    const newTodo = {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        email: req.body.email,
    }
    userTodos.push(newTodo);
    userTodos = userTodos.map((todo, i) => { return { ...todo, id: i } })
    const result = await db.collection('users').updateOne({ email: req.body.email }, {
        $set: { todos: userTodos }
    });
    console.log(result);
    const updateUser = await db.collection('users').findOne({ email: req.body.email });
    const updatedTodos = updateUser.todos;
    console.log(updatedTodos)
    res.json(updatedTodos);
})

app.put('/deleteTodo', async (req, res) => {
    console.log('deleted req recieved with id', req.body.id, req.body.email);
    const user = await db.collection('users').findOne({ email: req.body.email });
    console.log(user)
    let userTodos = user.todos
    userTodos = userTodos.filter((todo) => +todo.id !== +req.body.id)
    console.log(userTodos)
    userTodos = userTodos.map((todo, i) => { return { ...todo, id: i } });
    const result = await db.collection('users').updateOne({ email: req.body.email }, {
        $set: { todos: userTodos }
    });
    const updateUser = await db.collection('users').findOne({ email: req.body.email });
    const updatedTodos = updateUser.todos;
    console.log(updatedTodos)
    res.json(updatedTodos);
})

app.get(`/getTodos/user`, async (req, res) => {
    console.log(req.params.user)
    try {
        const user = await db.collection('users').findOne({ email: req.query.email, password: req.query.password });
        console.log(user, req.query.email, req.query.password)
        let userTodos = user.todos;
        res.json(userTodos)
    }
    catch (err) {
        res.json(err)
    }
})
app.listen(1000)