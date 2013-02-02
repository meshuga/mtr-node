"use strict"
express = require('express')
http = require('http')
path = require('path')
io = require('socket.io')
spawn = require('child_process').spawn

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

# Main page definition
app.get('/', (req, res) ->
  res.render('home')
)

# Socket.IO definitions
io.sockets.on('connection', (socket) ->
  mtrProcess = null

  # Kill MTR
  socket.on('kill-mtr', (data) ->
    mtrProcess.kill() if mtrProcess?
  )

  # Create new MTR process and bind process events to socket
  socket.on('mtr', (data) ->
    mtrProcess.kill() if mtrProcess?
    mtrProcess = spawn('mtr', [ '-p', data.address ])
    getResponses(socket, data.address, mtrProcess)
    socket.emit('got', {cmd: 'ok', data: 'mtr started'})
  )

  # Kill MTR in case of client disconnection
  socket.on('disconnect', () ->
    mtrProcess.kill() if mtrProcess?
  )
)

# Start the server
server.listen(app.get('port'), ->
  console.log("Express server listening on port " + app.get('port'))
)

# Binds MTR events (data on stderr, stdout and process exited) to a socket
getResponses = (socket, address, mtrProcess)->
  mtrProcess.stderr.on('data', (data) ->
    socket.emit('got', {cmd: 'nok', data: data.toString()})
  )
  mtrProcess.stdout.on('data', (data) ->
    # MTR can return more than one line at the same time
    lines = data.toString().split('\n')
    for line in lines
      if(line == '') then break
      line = line.split(' ')
      socket.emit('update', {data: line})
  )
  mtrProcess.on('exit', ->
    socket.emit('got', {cmd: 'nok', data: 'MTR was killed'})
  )
