'use strict'

var board
var canvas
var sidenav_width = 63
var board_width = 1000
var board_height = 700
var box_width = 70
var box_height = 70
var rect_padding = 3
var x_offset = sidenav_width + sidenav_width / 2
var y_offset = box_height / 2

var selected_op = ''
var selected_color = '#009bd5'
var unselected_color = '#818181'

var group_move = false
var label_mode = false


window.onclick = (event) => {
  // console.log('click:', event)
  process_click(event)
}

window.onkeydown = (event) => {
  // console.log('onkeydown:', event)
}

window.onkeyup = (event) => {
  // console.log('onkeyup:', event)
  process_keyup(event)
}

function init () {
  if (/chrome/i.test(navigator.userAgent)) {
    console.log('using chrome')
    board = get_id('board')
    board.setAttribute('width', board_width)
    board.setAttribute('height', board_height)

    // console.log(fabric.version)
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

  canvas.discardActiveObject();
  canvas.renderAll()
}

function process_keyup (evt) {
  var char = get_char(evt.keyCode)

  if (label_mode) {
    if (char === 'ESC' || char === 'RETURN') {
      set_mode('label', 'off')
      canvas.discardActiveObject()
      canvas.renderAll()
    }
    else {
      add_char_to_label(get_ao(), char)
    }
  }
  else if (char === 'ESC') {
    if (get_ao()) {
      set_mode('label', 'on')
    }
  }
}

function process_click (event) {
  label_mode = false

  var active_obj = get_ao()

  if (selected_op === 'box' && !active_obj) {
    var x = event.clientX
    var y = event.clientY
    var inside = (x > sidenav_width && x < board_width + sidenav_width && y < board_height + 10)

    if (inside) {
      create_box(x, y)
    }
  }
  else if (selected_op === 'line' && active_obj) {
    if (!group_move && active_obj._objects !== undefined && active_obj._objects.length === 2) {
      var objs = active_obj._objects
      var zero_center = get_center(objs[0].aCoords)
      var one_center = get_center(objs[1].aCoords)
  
      var line = create_line([zero_center.x, zero_center.y, one_center.x, one_center.y])
  
      objs[0].lines.push({ position: 'begin', line: line })
      objs[1].lines.push({ position: 'end', line: line })
      canvas.add(line)
      canvas.sendToBack(line)
    }
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
  }
  else {
    objs.push(obj)
    group_move = false
  }

  for (var i = 0; i < objs.length; i++) {
    var o = objs[i]

    if (o.lines && o.lines.length) {
      var left = o.left
      var top = o.top

      if (group_move) {
        left += o_center_x
        top += o_center_y
      }

      var x = left + (o.width / 2)
      var y = top + (o.height / 2)

      for (var j = 0; j < o.lines.length; j++) {
        var line = o.lines[j]

        if (line.position === 'begin') {
          line.line.set({ 'x1': x, 'y1': y })
        }
        else if (line.position === 'end') {
          line.line.set({ 'x2': x, 'y2': y })
        }
      }
    }

    set_label_location(o, o_center_x, o_center_y)
  }

  group_move = false
  canvas.renderAll()
}

function create_box (X, Y) {
  var left = X - x_offset
  var top = Y - y_offset

  var rect = new fabric.Rect({
    left: left,
    top: top,
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

  var label_text = ''

  var text_center_x = left + box_width / 2
  left = text_center_x - (label_text.length / 2) * 10
  top += 25

  var label = new fabric.Text(label_text, {
    left: left, 
    top: top,
    fill: 'white',
    hasControls: false,
    selectable: false,
    fontFamily: 'monospace',
    fontSize: 16
  })  
  
  rect.label = label

  canvas.add(rect)
  canvas.add(label)
  canvas.setActiveObject(rect)
  set_mode('label', 'on')
}

function create_line (coords) {
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

function get_ao () {
  var ao = canvas.getActiveObject()
  console.log('ao:', ao)

  if (ao === undefined || ao === null) {
    ao = false
  }

  return ao
}

function get_char (code) {
  var char

  if (code === 16) {
    // char = 'shift'
    char = ''
  }
  else if (code === 27) {
    char = 'ESC'
  }
  else if (code === 13) {
    char = 'RETURN'
  }
  else if (code === 8) {
    char = 'BACKSPACE'
  }
  else if (!(code > 47 && code < 58) &&  // numeric (0-9)
           !(code > 64 && code < 91) &&  // upper alpha (A-Z)
           !(code > 96 && code < 123)) { // lower alpha (a-z)
    char = ''
  }
  else {
    char = String.fromCharCode(code)
  }

  console.log('char:', char)

  return char
}

function get_id (id) {
  return document.getElementById(id)
}

function set_label_location(o, x, y) {
  var label = o.label
  var left = o.left
  var top = o.top
  var text_center_x = left + (o.aCoords.tr.x - o.aCoords.tl.x) / 2

  left = text_center_x - (label.text.length / 2) * 10
  top = top + 25

  if (group_move) {
    left += x
    top += y
  }

  label.set( {'left': left, 'top': top })
}

function add_char_to_label(o, char) {
  if (char === 'BACKSPACE') {
    o.label.text = o.label.text.slice(0, -1)
  }
  else {
    o.label.text += char
  }
  set_label_location(o)
  canvas.renderAll()
}

function set_mode (mode, state) {
  var value

  if (state === 'on') {
    value = true
  }
  else {
    value = false
  }

  if (mode === 'label') {
    label_mode = value
  }
  
  console.log(mode, 'mode:', state)
}

// console.log('src:', event.srcElement.id)
// canvas.sendBackwards(text)
// canvas.setActiveObject(rect)
// canvas.discardActiveObject()