'use strict'

var board
var canvas
var sidenav_width = 63
var board_width = 1000
var board_height = 700
var box_width = 70
var box_height = 35
var rect_padding = 3

var selected_op = ''
var selected_color = '#009bd5'
var unselected_color = '#818181'

var group_move = false

window.onclick = (event) => {
  console.log('window click', event)
  process_click(event)
}

window.onkeydown = (event) => {
  if (event.keyCode === 16) { // "shift"
    console.log('shift down')
  } else {
    var letter = String.fromCharCode(event.keyCode)
    console.log(letter, 'down')
  }
}

window.onkeyup = (event) => {
  if (event.keyCode === 16) { // "shift"
    console.log('shift up')
  } else {
    var letter = String.fromCharCode(event.keyCode)
    console.log(letter, 'up')
  }
}

function init () {
  if (/chrome/i.test(navigator.userAgent)) {
    console.log('using chrome')
    var board = get_id('board')
    board.setAttribute('width', board_width)
    board.setAttribute('height', board_height)

    fabric.Group.prototype.hasControls = false
    fabric.Group.prototype.padding = 5
    canvas = new fabric.Canvas('board')
    canvas.on('object:moving', (event) => {
      process_move(event.target)
    })
  } else {
    document.body.innerHTML = 'you must use chrome'
  }
}

function process_move (obj) {
  // console.log(obj)

  var o_center_x = obj.left + (obj.aCoords.tr.x - obj.aCoords.tl.x) / 2
  var o_center_y = obj.top + (obj.aCoords.bl.y - obj.aCoords.tl.y) / 2

  var objs = []

  if (obj._objects) {
    Object.keys(obj._objects).forEach((key) => {
      objs.push(obj._objects[key])
    })

    group_move = true
  } else {
    objs.push(obj)
    group_move = false
  }

  for (var i = 0; i < objs.length; i++) {
    var o = objs[i]

    if (o.lines && o.lines.length) {
      var left = o.left
      var top = o.top

      if (group_move) {
        left = o_center_x + left
        top = o_center_y + top
      }

      var x = left + (o.width / 2)
      var y = top + (o.height / 2)

      for (var j = 0; j < o.lines.length; j++) {
        var line = o.lines[j]

        if (line.position === 'begin') {
          move_line(line.line, { 'x1': x, 'y1': y })
        } else if (line.position === 'end') {
          move_line(line.line, { 'x2': x, 'y2': y })
        }
      }
    }
  }

  canvas.renderAll()
}

function move_line (line, coor) {
  line.set(coor)
}

function select (op) {
  var not_op

  if (op === selected_op) {
    selected_op = ''
    not_op = get_id(op)
  } else {
    selected_op = op

    get_id(op).style.color = selected_color
    get_id(op).style.border = 'thin solid white'
    if (op === 'box') {
      not_op = get_id('line')
    } else {
      not_op = get_id('box')
    }
  }

  not_op.style.color = unselected_color
  not_op.style.border = 'none'
}

function process_click (event) {
  var activeObject = canvas.getActiveObject()

  if (activeObject === undefined) {
    var x = event.clientX
    var y = event.clientY
    var inside = (x > sidenav_width && x < board_width + sidenav_width && y < board_height + 10)

    if (inside && selected_op === 'box') {
      create_box(x, y)
    }
  } else if (selected_op === 'line' && !group_move && activeObject._objects && activeObject._objects.length === 2) {
    var objs = activeObject._objects
    var zero_center = get_center(objs[0].aCoords)
    var one_center = get_center(objs[1].aCoords)

    var line = create_line([zero_center.x, zero_center.y, one_center.x, one_center.y])

    objs[0].lines.push({ position: 'begin', line: line })
    objs[1].lines.push({ position: 'end', line: line })
    canvas.add(line)
    canvas.sendToBack(line)
  }
}

function create_box (X, Y) {
  var x_offset = sidenav_width + sidenav_width / 2
  var y_offset = box_height / 2

  var rect = new fabric.Rect({
    left: X - x_offset,
    top: Y - y_offset,
    fill: 'black',
    width: box_width,
    height: box_height,
    strokeWidth: 1,
    stroke: 'white',
    hasControls: false,
    padding: rect_padding,
    opacity: 0.8
  })

  rect.lines = []

  canvas.add(rect)
}

function create_line (coords) {
  console.log(coords)

  var line = new fabric.Line(coords, {
    strokeWidth: 2,
    stroke: 'white',
    opacity: 0.75,
    selectable: false
  })

  return line
}

function get_center (aCoords) {
  var x = ((aCoords.br.x - aCoords.bl.x) / 2) + aCoords.bl.x
  var y = ((aCoords.bl.y - aCoords.tl.y) / 2) + aCoords.tl.y

  return { x: x, y: y }
}

function get_id (id) {
  return document.getElementById(id)
}

/*
  console.log('src:', event.srcElement.id)
*/
