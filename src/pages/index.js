import React, { useState, useEffect, useRef } from "react"

import "../styles/global.css"

import settings from "../../static/home-config.json"

const HISTORY_KEY = "history"
const HIDDEN_HISTORY_KEY = "hidden_history"
const MAX_HISTORY_COUNT = 20

const getAliases = () => {
  var list = settings.aliases.clearAliases.concat(
    settings.aliases.closeAliases,
    settings.aliases.newTabAliases,
    settings.aliases.newTabFocusedAliases
  )
  settings.aliases.redirectAliases.forEach(element => {
    element.aliases.forEach(e => {
      list = list.concat(e)
    })
  })

  settings.aliases.searchAliases.forEach(element => {
    list = list.concat(element.alias)
  })

  return list.sort((a, b) => {
    return a.length - b.length
  })
}

const aliases = getAliases()

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false)
  const [inputText, setInputText] = useState("")
  const [history, setHistory] = useState([])
  const [hiddenHistory, setHiddenHistory] = useState([])
  const inputEl = useRef(null)
  const historyIndex = useRef(-1)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (hasMounted) {
      const historyItems = window.localStorage.getItem(HISTORY_KEY)
      const hiddenHistoryItems = window.localStorage.getItem(HIDDEN_HISTORY_KEY)

      setHistory(historyItems !== null ? JSON.parse(historyItems) : [])
      setHiddenHistory(
        hiddenHistoryItems !== null ? JSON.parse(hiddenHistoryItems) : []
      )
      inputEl.current.focus()
    }
  }, [hasMounted])

  useEffect(() => {
    if (hasMounted) {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    }
  }, [history, hasMounted])

  useEffect(() => {
    if (hasMounted) {
      window.localStorage.setItem(
        HIDDEN_HISTORY_KEY,
        JSON.stringify(hiddenHistory)
      )
    }
  }, [hasMounted, hiddenHistory])


  const keyDownHandler = e => {
    if (e.keyCode === 13) {
      // Enter
      runCommand()
    } else if (e.keyCode === 9) {
      // Tab
      e.preventDefault()
      runAutoComplete()
    } else if (e.keyCode === 38) {
      // Arrow Up
      e.preventDefault()
      runUpHistory()
    } else if (e.keyCode === 40) {
      // Arrow Down
      e.preventDefault()
      runDownHistory()
    }
  }

  // const runCommand2 = () => {
  //   var text = inputText.tr
  //   const historyText = inputText
  //   addHistory(historyText)

  // }

  // const addHistory = text => {
  //   addHistoryItem(settings.general.shellPrompt + " " + text)
  //   addHiddenHistoryItem(text)
  // }

  const runCommand = () => {
    let text = inputText
    const historyText = inputText
    addHistoryItem(settings.general.shellPrompt + " " + historyText)
    addHiddenHistoryItem(historyText)

    const newTabindex = settings.aliases.newTabAliases.findIndex(nta => {
      return text.startsWith(nta + " ")
    })

    const newTabFocusedIndex = settings.aliases.newTabFocusedAliases.findIndex(
      ntf => {
        return text.startsWith(ntf + " ")
      }
    )

    const searchAliasesIndex = settings.aliases.searchAliases.findIndex(sa => {
      console.log(sa.alias)
      return text.startsWith(sa.alias + " ")
    })

    if (searchAliasesIndex >= 0) {
      console.log("found")
      text = text.replace(
        settings.aliases.searchAliases[searchAliasesIndex].alias + " ",
        ""
      )
    }

    if (newTabindex >= 0) {
      text = text.replace(settings.aliases.newTabAliases[newTabindex] + " ", "")
    }

    if (newTabFocusedIndex >= 0) {
      text = text.replace(
        settings.aliases.newTabFocusedAliases[newTabFocusedIndex] + " ",
        ""
      )
    }

    if (settings.aliases.clearAliases.includes(text)) {
      clearConsole()
      return
    } else if (settings.aliases.closeAliases.includes(text)) {
      window.close()
    } else if (settings.aliases.newTabAliases.includes(text)) {
      window.open(window.location.origin)
    } else if (searchAliasesIndex >= 0) {
      window.location.href =
        settings.aliases.searchAliases[searchAliasesIndex].link + text
    } else {
      const i = settings.aliases.redirectAliases.findIndex(e => {
        return e.aliases.includes(text)
      })

      if (i >= 0) {
        if (newTabindex >= 0) {
          window.open(settings.aliases.redirectAliases[i].link)
        } else if (newTabFocusedIndex >= 0) {
          window.open(window.location.origin)
          window.location.href = settings.aliases.redirectAliases[i].link
        } else {
          window.location.href = settings.aliases.redirectAliases[i].link
        }
      }
    }

    historyIndex.current = -1
    setInputText("")
  }

  const runAutoComplete = () => {
    const text = inputText
    var arr = text.split(" ")

    const foundIndex = aliases.findIndex(a => {
      return a.startsWith(arr[arr.length - 1]) && a !== arr[arr.length - 1]
    })

    if (foundIndex >= 0) {
      arr[arr.length - 1] = aliases[foundIndex]
      setInputText(arr.join(" "))
    }
  }

  const runUpHistory = () => {
    if (hiddenHistory.length > 0) {
      if (historyIndex.current + 1 < hiddenHistory.length) {
        historyIndex.current = historyIndex.current + 1
      }

      if (
        historyIndex.current < hiddenHistory.length &&
        historyIndex.current >= 0
      ) {
        setInputText(
          hiddenHistory[hiddenHistory.length - 1 - historyIndex.current]
        )
      }
    }
  }

  const runDownHistory = () => {
    if (hiddenHistory.length > 0) {
      if (historyIndex.current - 1 >= -1) {
        historyIndex.current = historyIndex.current - 1
      }

      if (historyIndex.current >= 0) {
        setInputText(
          hiddenHistory[hiddenHistory.length - 1 - historyIndex.current]
        )
      } else if (historyIndex.current === -1) {
        setInputText("")
      }
    }
  }

  const clearConsole = () => {
    setHistory([])
    setInputText("")
  }

  const addHistoryItem = text => {
    setHistory([
      ...history,
      {
        key: Math.round(Math.random() * 1000000),
        value: text,
      },
    ])
  }

  const addHiddenHistoryItem = text => {
    var arr = [...hiddenHistory]
    if (arr.length + 1 > MAX_HISTORY_COUNT) {
      console.log(arr.splice(0, 1)[0] + " removed from history")
    }
    arr.push(text)
    setHiddenHistory(arr)
  }

  const getCurrentTime = () => {
    var time = new Date()
    var hour = time.getHours()
    var ampm = "pm"

    if (hour === 0) {
      hour = 12
      ampm = "am"
    } else if (hour === 12) {
      ampm = "pm"
    } else if (hour < 12) {
      ampm = "am"
    } else {
      hour = hour % 12
    }
    var min = time.getMinutes()
    if (min < 10) {
      min = "0" + min
    }

    var output =
      hour +
      ":" +
      min +
      ampm +
      " " +
      (time.getMonth() + 1) +
      "/" +
      time.getDate() +
      "/" +
      time.getFullYear()
    return output
  }

  const getDay = () => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wenesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]

    return days[new Date().getDay()]
  }

  return (
    <div className="container">
      {settings.style && (
        <div
          className="content"
          style={{
            width: settings.style.consoleWidth,
            height: settings.style.consoleHeight,
            maxWidth: settings.style.consoleWidth,
            maxHeight: settings.style.consoleHeight,
            minWidth: settings.style.consoleWidth,
            minHeight: settings.style.consoleHeight,
            marginLeft: settings.style.consoleXOffset,
            marginTop: settings.style.consoleYOffset,
            borderRadius: settings.style.consoleBorderRadius,
            backdropFilter: "blur(" + settings.style.consoleBlurStrength + ")",
            WebkitBackdropFilter:
              "blur(" + settings.style.consoleBlurStrength + ")",
            backgroundColor: settings.style.consoleBackgroundColor,
            scrollbarColor: settings.style.consoleScrollbarColor,
            msScrollbarHighlightColor:
              settings.style.consoleScrollbarHighlightColor,
          }}
        >
          <div
            className="console-top-bar"
            style={{
              background: settings.style.consoleTopBarColor,
              borderTopLeftRadius: settings.style.consoleBorderRadius,
              borderTopRightRadius: settings.style.consoleBorderRadius,
            }}
          >
            <p
              className="console-title"
              style={{
                color: settings.style.consoleTitleColor,
                fontSize: settings.style.consoleTitleFontSize,
              }}
            >
              {getCurrentTime()}
            </p>

            <p
              className="console-title"
              style={{
                color: settings.style.consoleTitleColor,
                fontSize: settings.style.consoleTitleFontSize,
              }}
            >
              {getDay()}
            </p>
          </div>
          <div className="console-container">
            <div className="console-item-container">
              {history.map(item => {
                return (
                  <p
                    className="historyItem"
                    key={item.key.toString()}
                    style={{
                      color: settings.style.consoleTextColor,
                    }}
                  >
                    {item.value}
                  </p>
                )
              })}

              <p
                className="shell"
                style={{
                  color: settings.style.consolePromptColor,
                }}
              >
                {settings.general.shellPrompt}&nbsp;
                <input
                  type="text"
                  className="consoleInput"
                  spellCheck="false"
                  ref={inputEl}
                  style={{ color: settings.style.consoleTextColor }}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={keyDownHandler}
                ></input>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
