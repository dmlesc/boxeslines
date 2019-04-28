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
  console.log('window click:', event)
  process_click(event)
}

window.onkeydown = (event) => {
  console.log('onkeydown')

  var kc = get_kc(event.keyCode)
}

window.onkeyup = (event) => {
  console.log('onkeyup')

  var kc = get_kc(event.keyCode)

  if (label_mode) {
    
  }
  else if (kc === 'esc') {
    var active_obj = get_ao()
    console.log(active_obj.label) 

    label_mode = true
  }
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

    if (o.label) {
      var label = o.label
      var left = o.left
      var top = o.top
      var text_center_x = left + (o.aCoords.tr.x - o.aCoords.tl.x) / 2

      left = text_center_x - (label.text.length / 2) * 10
      top = top + 25

      if (group_move) {
        left += o_center_x
        top += o_center_y
      }

      label.set( {'left': left, 'top': top })
    }
  }

  canvas.renderAll()
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

function process_click (event) {
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

  var label_text = 'text'

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

function get_kc (keyCode) {
  var letter

  if (keyCode === 16) {
    letter = 'shift'
  }
  else if (keyCode === 27) {
    letter = 'esc'
  }
  else {
    letter = String.fromCharCode(event.keyCode)
  }

  console.log('letter:', letter)

  return letter
}

function get_id (id) {
  return document.getElementById(id)
}


// console.log('src:', event.srcElement.id)
// canvas.sendBackwards(text)
// canvas.setActiveObject(rect)
// canvas.discardActiveObject();