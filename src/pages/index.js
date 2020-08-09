import React, { useState, useEffect, useRef } from "react"

import "../styles/global.css"

const HISTORY_KEY = "history"
const HIDDEN_HISTORY_KEY = "hidden_history"
const MAX_HISTORY_COUNT = 20

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false)
  const [inputText, setInputText] = useState("")
  const [history, setHistory] = useState([])
  const [hiddenHistory, setHiddenHistory] = useState([])
  const inputEl = useRef(null)
  const historyIndex = useRef(-1)
  const [settings, setSettings] = useState({})
  const [aliases, setAliases] = useState([])

  useEffect(() => {
    fetch(window.location.origin + "/home-config.json")
      .then(x => x.json())
      .then(x => setSettings(x))
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

  useEffect(() => {
    if (hasMounted && settings.style) {
      inputEl.current.focus()
      setAliases(() => {
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
      })
    }
  }, [settings, hasMounted])

  const keyDownHandler = e => {
    if (e.keyCode === 13) {
      // Enter
      runCommand2()
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

  const runCommand2 = () => {
    var text = inputText.trim().split(" ")
    const historyText = inputText
    addHistory(historyText)

    if (text.length <= 0) {
      resetInput()
      return
    }

    if (settings.aliases.clearAliases.includes(text[0]) && text.length === 1) {
      clearConsole()
      resetInput()
      return
    } else if (
      settings.aliases.closeAliases.includes(text[0]) &&
      text.length === 1
    ) {
      resetInput()
      window.close()
      return
    } else if (text[0] === "help") {
      helpInfo()
      resetInput()
      return
    }

    var isNewTab = settings.aliases.newTabAliases.includes(text[0])
    var isNewFocusedTab = settings.aliases.newTabFocusedAliases.includes(
      text[0]
    )

    if (isNewTab || isNewFocusedTab) {
      if (text.length === 1) {
        window.open(window.location.origin)
        return
      } else {
        text.splice(0, 1)
      }
    }

    const redirect_index = settings.aliases.redirectAliases.findIndex(e => {
      return e.aliases.includes(text[0])
    })
    console.log(redirect_index)
    const search_index = settings.aliases.searchAliases.findIndex(a => {
      return a.alias.includes(text[0])
    })

    if (search_index >= 0) {
      console.log(text)
      text.splice(0, 1)
      const link =
        settings.aliases.searchAliases[search_index].link + text.join(" ")
      
      navigate(link, isNewTab, isNewFocusedTab)
    } else if (redirect_index >= 0) {
      let link

      var shouldNavigate = true

      if (text.length === 1) {
        link = settings.aliases.redirectAliases[redirect_index].link
      } else {
        if (settings.aliases.redirectAliases[redirect_index].subAliases) {
          var a = settings.aliases.redirectAliases[
            redirect_index
          ].subAliases.find(e => {
            return e.subAlias === text[1] && text.length === 2
          })
          if (a) {
            if (a.newUrl) {
              link = a.newUrl
            } else {
              link =
                settings.aliases.redirectAliases[redirect_index].link + a.dir
            }
          } else {
            shouldNavigate = false
          }
        } else {
          shouldNavigate = false
        }
      }

      if (shouldNavigate) {
        navigate(link, isNewTab, isNewFocusedTab)
      }
    }

    resetInput()
  }

  const navigate = (link, isNewTab, isNewFocusedTab) => {
    if (isNewTab) {
      window.open(link)
    } else if (isNewFocusedTab) {
      window.open(window.location.origin)
      window.location.href = link
    } else {
      window.location.href = link
    }
  }

  const resetInput = () => {
    historyIndex.current = -1
    setInputText("")
  }

  const addHistory = text => {
    addHistoryItem(settings.general.shellPrompt + " " + text)
    addHiddenHistoryItem(text)
  }

  const helpInfo = () => {
    var helpLines = []
    helpLines.push("To clear the history you can type the following:")
    helpLines.push(settings.aliases.clearAliases.join(" , "))
    helpLines.push("------------------------------------")
    helpLines.push("Type any of the following to go their respective website:")

    settings.aliases.redirectAliases.forEach(i => {
      helpLines.push(i.aliases.join(" , ") + " -->  " + i.link)
    })

    helpLines.push("------------------------------------")

    helpLines.push(
      "Type the following followed by text to look for something in that website:"
    )

    settings.aliases.searchAliases.forEach(i => {
      if (i.alias !== "url") {
        helpLines.push(
          i.alias + "  ---searches in---> " + new URL(i.link).hostname
        )
      }
    })

    addHistoryItems(helpLines)
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

  const addHistoryItems = items => {
    setHistory([
      ...history,
      ...items.map(i => {
        return {
          key: Math.round(Math.random() * 1000000),
          value: i,
        }
      }),
    ])
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
    const days = ["Sunday", "Monday", "Tuesday", "Wenesday", "Thursday", "Friday", "Saturday"]

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
              borderTopRightRadius: settings.style.consoleBorderRadius
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
