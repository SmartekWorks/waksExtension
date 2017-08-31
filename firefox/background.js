let openedWindows = {}

let openModeling = () => {
  let currentTab

  browser.tabs.query({currentWindow: true, active: true}).then(tabs => {
    if (tabs.length == 0) {
      return Promise.reject(new Error('Current tab not exists.'))
    }

    currentTab = tabs[0].id.toString()

    return browser.windows.getAll({windowTypes: ['panel'], populate: true})
  }).then(windows => {
    if (openedWindows.hasOwnProperty(currentTab)) {
      let windowInfo = windows.find(element => {
        return element.id == openedWindows[currentTab]
      })

      if (windowInfo) {
        browser.tabs.sendMessage(windowInfo.tabs[0].id, {tabID: currentTab})
        return windowInfo
      }
    }

    let createData = {
      type: 'detached_panel',
      url: 'waks/parse.html?tabID=' + currentTab,
      width: 800,
      height: 700
    }
    return browser.windows.create(createData)
  }).then(windowInfo => {
    browser.windows.update(windowInfo.id, {focused: true})
    openedWindows[currentTab] = windowInfo.id
  }).catch(error => {
    console.log(error)
  })
}

browser.browserAction.onClicked.addListener(openModeling)
