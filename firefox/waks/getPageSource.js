if (true) {
  let title = document.title
  if (!title || title == '') { title = 'pages' }
  let allHtml = {'title': title, 'contents': []}

  let getFramePageSource = function (frame, prefix, url, identity) {
    if (frame.contentDocument) {
      let htmlName = prefix + '.html'

      let cloneFrame = frame.contentDocument.documentElement.cloneNode(true)

      for (let i = 0; i < frame.contentDocument.getElementsByTagName('frame').length; i++) {
        getFramePageSource(
          frame.contentDocument.getElementsByTagName('frame')[i],
          prefix + '-' + i.toString(),
          cloneFrame.getElementsByTagName('frame')[i].src,
          {
            'name': cloneFrame.getElementsByTagName('frame')[i].name,
            'id': cloneFrame.getElementsByTagName('frame')[i].id
          }
        )
        cloneFrame.getElementsByTagName('frame')[i].src = prefix + '-' + i.toString() + '.html'
      }

      for (let i = 0; i < frame.contentDocument.getElementsByTagName('iframe').length; i++) {
        getFramePageSource(
          frame.contentDocument.getElementsByTagName('iframe')[i],
          prefix + '-' + (i + frame.contentDocument.getElementsByTagName('frame').length).toString(),
          cloneFrame.getElementsByTagName('iframe')[i].src,
          {
            'name': cloneFrame.getElementsByTagName('iframe')[i].name,
            'id': cloneFrame.getElementsByTagName('iframe')[i].id
          }
        )
        cloneFrame.getElementsByTagName('iframe')[i].src = prefix + '-' + (i + frame.contentDocument.getElementsByTagName('frame').length).toString() + '.html'
      }

      allHtml.contents.push({'name': htmlName, 'html': cloneFrame.outerHTML, 'url': url, 'identity': identity})
    }
  }

  let cloneDoc = document.documentElement.cloneNode(true)

  for (let i = 0; i < document.getElementsByTagName('frame').length; i++) {
    try {
      getFramePageSource(
        document.getElementsByTagName('frame')[i],
        i.toString(),
        cloneDoc.getElementsByTagName('frame')[i].src,
        {
          'name': cloneDoc.getElementsByTagName('frame')[i].name,
          'id': cloneDoc.getElementsByTagName('frame')[i].id
        }
      )
      cloneDoc.getElementsByTagName('frame')[i].src = i.toString() + '.html'
    } catch (err) {
      console.log(err.message)
    }
  }

  for (let i = 0; i < document.getElementsByTagName('iframe').length; i++) {
    try {
      getFramePageSource(
        document.getElementsByTagName('iframe')[i],
        (i + document.getElementsByTagName('frame').length).toString(),
        cloneDoc.getElementsByTagName('iframe')[i].src,
        {
          'name': cloneDoc.getElementsByTagName('iframe')[i].name,
          'id': cloneDoc.getElementsByTagName('iframe')[i].id
        }
      )
      cloneDoc.getElementsByTagName('iframe')[i].src = (i + document.getElementsByTagName('frame').length).toString() + '.html'
    } catch (err) {
      console.log(err.message)
    }
  }

  allHtml.contents.push({'name': 'main.html', 'html': cloneDoc.outerHTML, 'url': document.URL, 'identity': {'name': '', 'id': ''}})

  allHtml
}
