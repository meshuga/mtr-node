"use strict"
express = require('express')
http = require('http')
path = require('path')
io = require('socket.io')
spawn = require('child_process').spawn

routes = require('./routes')

app = express()
server = http.createServer(app)
io = io.listen(server)
io.set('log level', 2)


app.configure( ->
  app.set('port', process.env.PORT || 6662)
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(express.favicon())
  app.use(express.logger('dev'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(path.join(__dirname, 'public')))
)

app.configure('development', ->
  app.use(express.errorHandler())
)

app.get('/', routes.index)

io.sockets.on('connection', (socket) ->
  mtrProcess = null

  socket.on('kill-mtr', (data) ->
    mtrProcess.kill() if mtrProcess?
    socket.emit('got', {cmd: 'nok', data: 'mtr killed'})
  )

  socket.on('mtr', (data) ->
    mtrProcess.kill() if mtrProcess?
    mtrProcess = spawn('mtr', [ '-p', data.address ])
    getResponses(socket, data.address, mtrProcess)
    socket.emit('got', {cmd: 'ok', data: 'mtr started'})
  )

  socket.on('disconnect', () ->
    mtrProcess.kill() if mtrProcess?
  )
)

server.listen(app.get('port'), ->
  console.log("Express server listening on port " + app.get('port'))
)

getResponses = (socket, address, mtrProcess)->
  mtrProcess.stderr.on('data', (data) ->
    socket.emit('got', {cmd: 'nok', data: data.toString()})
  )
  mtrProcess.stdout.on('data', (data) ->
    lines = data.toString().split('\n')
    for line in lines
      if(line == '') then break
      line = line.split(' ')
      socket.emit('update', {data: line})
  )
