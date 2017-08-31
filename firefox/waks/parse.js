
let serverInfo = {}

let ajaxPost = function (apiURL, data) {
  return new Promise((resolve, reject) => {
    let authInfo = btoa(serverInfo.username + ':' + serverInfo.apikey)

    $.ajax({
      url: apiURL,
      method: 'POST',
      data: data,
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', 'Basic ' + authInfo)
      }
    }).done(function (data) {
      resolve(data)
    }).fail(function (xhr) {
      reject(new Error('API call error:' + apiURL))
    })
  })
}

let ajaxGet = function (apiURL) {
  return new Promise((resolve, reject) => {
    let authInfo = btoa(serverInfo.username + ':' + serverInfo.apikey)

    $.ajax({
      url: apiURL,
      type: 'GET',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', 'Basic ' + authInfo)
      }
    }).done(function (data) {
      resolve(data)
    }).fail(function (jqXHR) {
      reject(new Error('API call error:' + apiURL))
    })
  })
}

let loadTree = function (targetTab, source, nodesTree) {
  // clear target tab selection
  browser.tabs.sendMessage(targetTab, {
    frameLoc: '',
    nodeXPath: '',
    selectedXPath: ''
  })

  if (nodesTree) {
    nodesTree.reload(source)
  } else {
    $('#treeNodes').fancytree({
      autoCollapse: true,
      clickFolderMode: 3,
      autoScroll: true,
      source: source,
      focus: function (event, data) {
        data.node.scrollIntoView(true)
      },
      init: function (event, data) {
        var tree = data.tree

        $('#jsonRelatedRule').html('')
        $('#jsonRelatedDOM').html('')
        new JSONEditor(document.getElementById('jsonRelatedRule'),
          {
            mode: 'view',
            name: 'Template',
            search: false
          }, tree.data.rule
        )

        new JSONEditor(document.getElementById('jsonRelatedDOM'),
          {
            mode: 'view',
            name: 'DOM Attributes',
            search: false
          }, tree.data.domAttributes
        )
      },
      activate: function (event, data) {
        let node = data.node
        $('#jsonRelatedRule').html('')
        $('#jsonRelatedDOM').html('')
        new JSONEditor(document.getElementById('jsonRelatedRule'),
          {
            mode: 'view',
            name: 'Template',
            search: false
          }, node.data.rule
        )

        new JSONEditor(document.getElementById('jsonRelatedDOM'),
          {
            mode: 'view',
            name: 'DOM Attributes',
            search: false
          }, node.data.domAttributes
        )

        let nodeXPath = ''
        let selectedXPath = ''
        if (node.getParentList().length > 0) {
          node.getParentList()[0].visit(function (node) {
            if (node.data.xpath) {
              if (nodeXPath == '') {
                nodeXPath = node.data.xpath.toString()
              } else {
                nodeXPath += ',' + node.data.xpath.toString()
              }
            }
          }, false)
        }
        node.visit(function (node) {
          if (node.data.xpath) {
            if (node.data.xpath) {
              if (selectedXPath == '') {
                selectedXPath = node.data.xpath.toString()
              } else {
                selectedXPath += ',' + node.data.xpath.toString()
              }
            }
          }
        }, true)

        browser.tabs.sendMessage(targetTab, {
          frameLoc: node.data.frame.toString(),
          nodeXPath: nodeXPath,
          selectedXPath: selectedXPath
        })
      }
    })

    nodesTree = $('#treeNodes').fancytree('getTree')
  }

  return nodesTree
}

let getShtmString = targetTab => {
  return browser.tabs.executeScript(targetTab, {
    file: 'getPageSource.js'
  }).then(function (result) {
    // make shtm file
    let zip = new JSZip()
    let urlMap = {}
    let framesMap = {}

    for (let i = 0; i < result[0].contents.length; i++) {
      let file = result[0].contents[i]
      urlMap[file.name] = file.url
      framesMap[file.name] = file.identity

      zip.file(file.name, file.html)
    }

    zip.file('urlMap.json', JSON.stringify(urlMap))
    zip.file('framesMap.json', JSON.stringify(framesMap))

    return zip.generateAsync({type: 'blob'})
  }).then(function (blob) {
    // generate blob data to base64 strng
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  })
}

$(function () {
  let urlParams = new URLSearchParams(window.location.search)
  let targetTab = parseInt(urlParams.get('tabID'))

  let shtmFile, nodesTree

  let jsonRule = {'imports': [{'name': 'html5', 'version': '1.0.0'}]}

  let editorRule = new JSONEditor(document.getElementById('jsonRule'),
    { mode: 'code' },
    jsonRule
  )

  browser.runtime.onMessage.addListener(request => {
    getShtmString(targetTab).then(function (base64String) {
      shtmFile = base64String
      let apiURL = serverInfo.server + '/api/' + serverInfo.workspace + '/pages/parse'
      let postData = {
        file: shtmFile,
        rule: JSON.stringify(editorRule.get()),
        name: 'Preview'
      }
      return ajaxPost(apiURL, postData)
    }).then(function (data) {
      // load nodes tree
      nodesTree = loadTree(targetTab, data.nodesTree, nodesTree)
    }).catch(function (error) {
      console.log(`Error: ${error}`)
    })
  })

  $('#actionParse').on('click', function (e) {
    let apiURL = serverInfo.server + '/api/' + serverInfo.workspace + '/pages/parse'
    let data = {
      file: shtmFile,
      rule: JSON.stringify(editorRule.get()),
      name: 'Preview'
    }

    ajaxPost(apiURL, data).then(function (data) {
      nodesTree = loadTree(targetTab, data.nodesTree, nodesTree)
      $('#tabsRule a[href="#tabModel"]').tab('show')
    })
  })

  $('#dlgSettings .btn-primary').on('click', function (e) {
    const server = {
      server: $('#textServer').val(),
      workspace: $('#textWorkspace').val(),
      username: $('#textUsername').val(),
      apikey: $('#textAPIKey').val()
    }
    browser.storage.local.set({ server: server }).then(function () {
      serverInfo = server
    })
  })

  $('#dlgSaveToSWATHub .btn-primary').on('click', function (e) {
    let apiURL = serverInfo.server + '/api/' + serverInfo.workspace + '/pages'
    let data = {
      file: shtmFile,
      rule: JSON.stringify(editorRule.get()),
      name: $('#textName').val()
    }

    ajaxPost(apiURL, data).then(function (data) {
      jsonRule = editorRule.get()
    })
  })

  $('#actionReset').on('click', function (e) {
    editorRule.set(jsonRule)
  })

  browser.storage.local.get().then(function (item) {
    // get tree data
    if (item.hasOwnProperty('server')) {
      serverInfo = item.server
      $('#textServer').val(serverInfo.server)
      $('#textWorkspace').val(serverInfo.workspace)
      $('#textUsername').val(serverInfo.username)
      $('#textAPIKey').val(serverInfo.apikey)
      return getShtmString(targetTab)
    } else {
      $('#tabsRule a[href="#tabTemplate"]').tab('show')
      $('#dlgSettings').modal()
      return Promise.reject(new Error('You need set server info first.'))
    }
  }).then(function (base64String) {
    shtmFile = base64String
    // get nodes source
    let apiURL = serverInfo.server + '/api/' + serverInfo.workspace + '/pages/parse'
    let postData = {
      file: shtmFile,
      rule: JSON.stringify(editorRule.get()),
      name: 'Preview'
    }
    return ajaxPost(apiURL, postData)
  }).then(function (data) {
    // load nodes tree
    nodesTree = loadTree(targetTab, data.nodesTree, nodesTree)

    let apiURL = serverInfo.server + '/api/' + serverInfo.workspace + '/templates'
    return ajaxGet(apiURL)
  }).then(function (data) {
    // load rule libs
    let templates = data.templates
    templates.forEach(template => {
      if (template.type == 'page') {
        let ruleElement = '<li><a data-rule-type="' + template.type + '" data-rule-key="' + template.key + '">Page: ' + template.name + '</a></li>'
        $('#actionSelectRule').append(ruleElement)
      } else if (template.type == 'rule') {
        let ruleElement = '<li><a data-rule-type="' + template.type + '" data-rule-key="' + template.key + '">Rule: ' + template.name + ' ' + template.version + '</a></li>'
        $('#actionSelectRule').append(ruleElement)
      }
    })

    $('#actionSelectRule a').on('click', function (e) {
      let type = $(this).attr('data-rule-type')
      let key = $(this).attr('data-rule-key')
      let rule = templates.find(element => {
        return element.type == type && element.key == key
      }).rule
      editorRule.set(rule)
    })
  }).catch(function (error) {
    console.log(`Error: ${error}`)
  })
})
