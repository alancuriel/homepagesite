import React, { useState } from "react"

import "../styles/global.css"

import settings from "../../static/home-config.json"

export default function Home() {
  const [inputText, setInputText] = useState("s")
  const [history, setHistory] = useState([{ key: 1, value: "cd" }])

  const keyDownHandler = e => {
    if (e.keyCode === 13) {
      runCommand()
    }
  }

  const runCommand = () => {
    const text = inputText;
    if(settings.aliases.clearAliases.includes(text)) {
      clearConsole();
      return;
    } else {

      const i = settings.aliases.redirectAliases.findIndex((e) => {
       return e.aliases.includes(text);
      });

      if (i >= 0) {
        window.location.href = settings.aliases.redirectAliases[i].link;
      }

    }

    addHistoryItem(settings.general.shellPrompt + " " + text);
    setInputText("");
  };

  const clearConsole = () => {
    setHistory([])
    setInputText("")
  };

  const addHistoryItem = (text) => {
    setHistory([...history, {
      key: Math.round(Math.random * 1000000),
      value: text
    }]);
  };

  return (
    <div className="container">
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
          return <p className="historyItem" key={item.key} style={{
            color: settings.style.consoleTextColor
          }}
          >
            {item.value}
            </p>
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
            style={{ color: settings.style.consoleTextColor }}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={keyDownHandler}
          ></input>
        </p>
      </div>
    </div>
  )
}
