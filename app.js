var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');
mongoose.Promise = Promise;
var slug = require('slug');
mongoose.connect('mongodb://yo:yo@ds127892.mlab.com:27892/editor_01');
var pageSchema = new mongoose.Schema({
  slug: String,
  content: String
});
pageSchema.plugin(require('mongoose-findorcreate'))
var Page = mongoose.model('Page', pageSchema)

app.engine('.hbs', require('express-handlebars')({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs');

app.get('/', function (req, res) {
  res.render('index', { slug: 'index' });
});

app.get('/:slug', function(req, res) {
  res.render('index', { slug: req.params.slug });
})
io.on('connection', function(socket) {

  socket.on('get', function(data) {
    Page.findOrCreate({ slug: data.slug }, { content: '' })
      .catch(function(err) {
        return socket.emit('err', err)
      })
      .then(function(page) {
        socket.join(data.slug)
        var page = page.doc
        return socket.emit('get', { slug: page.slug, content: page.content })
      })
  })
  socket.on('send', function(data) {
    Page.findOneAndUpdate({ slug: data.slug }, { content: data.content }, { new: true })
      .catch(function(err) {
        return socket.emit('err', err)
      })
      .then(function(page) {
        var page = page.doc
        io.sockets.in(data.slug).emit('get', { slug: page.slug, content: page.content })
      })
  })
});

server.listen(process.env.PORT || 3000);
