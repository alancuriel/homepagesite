import React, { useState, useEffect, useRef } from "react"

import "../styles/global.css"

import settings from "../../static/home-config.json"

const HISTORY_KEY = "history"

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false)
  const [inputText, setInputText] = useState("")
  const [history, setHistory] = useState([])
  const inputEl = useRef(null)

  useEffect(() => {
    inputEl.current.focus()
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (hasMounted) {
      const stickyValue = window.localStorage.getItem(HISTORY_KEY)

      setHistory(stickyValue !== null ? JSON.parse(stickyValue) : [])
    }
  }, [hasMounted])

  useEffect(() => {
    if (hasMounted) {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    }
  }, [history, hasMounted])

  const keyDownHandler = e => {
    if (e.keyCode === 13) {
      runCommand()
    }
  }

  const runCommand = () => {
    let text = inputText
    const historyText = inputText
    addHistoryItem(settings.general.shellPrompt + " " + historyText)

    const newTabindex = settings.aliases.newTabAliases.findIndex(nta => {
      return text.startsWith(nta + " ")
    })

    const newTabFocusedIndex = settings.aliases.newTabFocusedAliases.findIndex(
      ntf => {
        return text.startsWith(ntf + " ")
      }
    )

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
          console.log("flocus")
        } else {
          window.location.href = settings.aliases.redirectAliases[i].link
        }
      }
    }

    setInputText("")
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

  return (
    <div className="container">
      {settings && (
        <div
          className="content"
          style={{
            width: settings.style.consoleWidth,
            height: settings.style.consoleHeight,
            borderRadius: settings.style.consoleBorderRadius,
            backdropFilter: "blur(" + settings.style.consoleBlurStrength + ")",
            WebkitBackdropFilter:
              "blur(" + settings.style.consoleBlurStrength + ")",
            backgroundColor: settings.style.consoleBackgroundColor,
          }}
        >
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
      )}
    </div>
  )
}
