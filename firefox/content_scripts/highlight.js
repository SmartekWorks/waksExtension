let eval_xpath = function (doc, xpath) {
  try {
    if (doc.evaluate) {
      return doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    } else {
      let tags = xpath.slice(1).split('/')
      let ele = doc.body
      for (let i = 1; i < tags.length; ++i) {
        let idx = 1
        if (tags[i].indexOf('[') != -1) {
          idx = tags[i].split('[')[1].split(']')[0]
          tags[i] = tags[i].split('[')[0]
        }
        ele = $(ele).children(tags[i])[idx - 1]
      }

      return ele
    }
  } catch (err) {
    return null
  }
}

let clearCss = function (frame) {
  let doc = document
  if (frame) {
    doc = frame.contentWindow.document
  }
  let nodes = doc.querySelectorAll('.swat-node')
  for (let i = 0; i < nodes.length; ++i) {
    nodes[i].classList.remove('swat-node')
  }
  let selected = doc.querySelectorAll('.swat-selected')
  for (let i = 0; i < selected.length; ++i) {
    selected[i].classList.remove('swat-selected')
  }

  let frames = doc.querySelectorAll('frame, iframe')
  for (let i = 0; i < frames.length; ++i) {
    clearCss(frames[i])
  }
}

let getCurrentWindow = function (frameLoc) {
  let currWindow = window
  if (frameLoc) {
    frameLoc.split('-').forEach(function (countString) {
      let frameCount = document.querySelectorAll('frame').length
      let count = parseInt(countString)
      if (count < frameCount) {
        currWindow = document.querySelectorAll('frame')[count].contentWindow
      } else {
        currWindow = document.querySelectorAll('iframe')[count - frameCount].contentWindow
      }
    })
  }

  return currWindow
}

let getCurrentDoc = function (frameLoc) {
  let currDoc = document
  if (frameLoc) {
    currDoc = getCurrentWindow(frameLoc).document
  }

  return currDoc
}

let addClass = function (doc) {
  let css = '.swat-node { outline:dotted #00ff00 !important;}\n.swat-selected { outline:dotted #0000ff !important;}',
    head = doc.head || doc.getElementsByTagName('head')[0],
    style = doc.createElement('style')

  style.type = 'text/css'
  if (style.styleSheet) {
    style.styleSheet.cssText = css
  } else {
    style.appendChild(doc.createTextNode(css))
  }

  head.appendChild(style)
}

let highlightNodes = function (request, sender, sendResponse) {
  try {
    clearCss()
  } catch (e) {}

  let currDoc = getCurrentDoc(request.frameLoc)
  let currWindow = getCurrentWindow(request.frameLoc)
  let currNode

  request.nodeXPath.split(',').forEach(function (xpath) {
    if (xpath != '') {
      let element = eval_xpath(currDoc, xpath)
      if (element) {
        element.classList.remove('swat-selected')
        element.classList.add('swat-node')
      }
    }
  })

  request.selectedXPath.split(',').forEach(function (xpath) {
    if (xpath != '') {
      let element = eval_xpath(currDoc, xpath)
      if (element) {
        element.classList.add('swat-selected')
        element.classList.remove('swat-node')
        if (!currNode) {
          currNode = element
        }
      }
    }
  })

  if (currNode) {
    let winWidth = currWindow.innerWidth || currDoc.documentElement.clientWidth || currDoc.body.clientWidth
    let winHeight = currWindow.innerHeight || currDoc.documentElement.clientHeight || currDoc.body.clientHeight
    let rect = currNode.getBoundingClientRect()
    let top = (currWindow.pageYOffset || currDoc.documentElement.scrollTop) + rect.top
    let left = (currWindow.pageXOffset || currDoc.documentElement.scrollLeft) + rect.left
    currWindow.scrollTo(left - winWidth / 2, top - winHeight / 2)
  }
}

try {
  addClass(document)
  let frames = document.querySelectorAll('frame, iframe')
  for (let i = 0; i < frames.length; ++i) {
    addClass(frames[i].contentWindow.document)
  }
} catch (e) {}

browser.runtime.onMessage.addListener(highlightNodes)
