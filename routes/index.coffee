
exports.index = (req, res) ->
  res.render('home', { title: 'Home', id: 'home', brand: 'Hello' })
