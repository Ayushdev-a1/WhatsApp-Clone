import React, { useEffect } from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import reportWebVitals from "./reportWebVitals"
import { BrowserRouter } from "react-router-dom"
import { SocketProvider } from "./context/SocketContext"
import { AuthProvider } from "./context/AuthContext"
import { ChatProvider } from "./context/ChatContext"
import { CallProvider } from "./context/CallContext"
import "./tailwind.css"

function RootApp() {
  useEffect(() => {
    const container = document.getElementById("root")
    if (container) {
      const root = ReactDOM.createRoot(container)
      root.render(
        <React.StrictMode>
          <BrowserRouter>
            <AuthProvider>
              <SocketProvider>
                <ChatProvider>
                  <CallProvider>
                    <App />
                  </CallProvider>
                </ChatProvider>
              </SocketProvider>
            </AuthProvider>
          </BrowserRouter>
        </React.StrictMode>
      )
    }
  }, [])

  return null // since rendering is done manually
}

export default RootApp

reportWebVitals()
