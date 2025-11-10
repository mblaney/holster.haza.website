import {useEffect, useRef, useState} from "react"

const HolsterVisualization = () => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const [clientData, setClientData] = useState({})
  const myClientID = useRef(null)
  const pulses = useRef([]) // Array to store active pulses
  const serverColorEffect = useRef({color: null, intensity: 0, fadeTime: 0})

  // Generate unique client ID for each tab (persisted in sessionStorage)
  useEffect(() => {
    const getClientId = () => {
      // Try to get existing client ID from sessionStorage
      const existingId = sessionStorage.getItem("holster_client_id")
      if (existingId) {
        return existingId
      }

      // Generate a new unique ID for this tab/window
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const newId = `client_${timestamp}_${random}`

      // Store it in sessionStorage
      sessionStorage.setItem("holster_client_id", newId)
      return newId
    }

    myClientID.current = getClientId()
  }, [])

  // Holster integration - broadcast and listen for stats
  useEffect(() => {
    if (!window.holster || !myClientID.current) return

    const getDayKey = () => {
      const t = new Date()
      return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())
    }

    const dayKey = getDayKey()
    const activeListeners = new Set()

    // Helper function to add pulse animation
    const addPulse = (fromClientId, color, toClientId = "server") => {
      // Server-originated pulses are single-stage (1000ms), others are two-stage (2000ms)
      const duration = fromClientId === "server" ? 1000 : 2000
      pulses.current.push({
        fromClientId,
        toClientId, // 'server' or actual client ID
        color,
        startTime: Date.now(),
        duration,
      })
    }

    // Broadcast our presence at random intervals between 2-5 seconds
    let broadcastTimeoutId
    const startTime = Date.now()
    const scheduleNextBroadcast = () => {
      const elapsedSeconds = (Date.now() - startTime) / 1000
      // Use shorter delays on page load then back off.
      const randomDelay =
        elapsedSeconds >= 10
          ? 10000 + Math.random() * 2000
          : 2000 + Math.random() * 3000
      broadcastTimeoutId = setTimeout(() => {
        const timestamp = Date.now()
        window.holster
          .get("stats")
          .next(dayKey)
          .next(myClientID.current)
          .put(timestamp, err => {
            if (err) {
              console.log("Error broadcasting presence:", err)
            } else {
              // Add green pulse from this client to server
              addPulse(myClientID.current, "#4ade80", "server")

              // Add green pulses from server to all other connected clients
              // Get current client data at the time of broadcast
              setClientData(currentClientData => {
                const currentClients = Object.keys(currentClientData)
                const otherClients = currentClients.filter(
                  id => id !== myClientID.current,
                )
                otherClients.forEach(otherClientId => {
                  // Delay to sync with first pulse reaching server
                  setTimeout(() => {
                    addPulse("server", "#4ade80", otherClientId)
                  }, 1000) // 1 second delay - first leg of 2-stage pulse
                })
                return currentClientData // Don't actually update state
              })
            }
            // Schedule the next broadcast
            scheduleNextBroadcast()
          })
      }, randomDelay)
    }

    // Listen for new clients appearing in today's stats
    window.holster.get("stats").next(dayKey).on(data => {
      if (data) {
        Object.keys(data).forEach(clientID => {
          if (!activeListeners.has(clientID)) {
            activeListeners.add(clientID)

            // Set up individual listener for this client's timestamps
            window.holster
              .get("stats")
              .next(dayKey)
              .next(clientID)
              .on(timestamp => {
                if (timestamp && typeof timestamp === "number") {
                  setClientData(prev => ({
                    ...prev,
                    [clientID]: timestamp,
                  }))

                  // Add orange pulse from other clients to our client (incoming data)
                  if (clientID !== myClientID.current) {
                    addPulse(clientID, "#fb923c", myClientID.current)
                  }
                }
              }, true)
          }
        })
      }
    }, true)

    // Start the first broadcast
    scheduleNextBroadcast()

    return () => {
      if (broadcastTimeoutId) {
        clearTimeout(broadcastTimeoutId)
      }
    }
  }, [])

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Limit to 20fps for better performance
    const targetFPS = 20
    const frameDelay = 1000 / targetFPS
    let lastFrameTime = 0

    const animate = currentTime => {
      // Skip frame if not enough time has passed
      if (currentTime - lastFrameTime < frameDelay) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastFrameTime = currentTime
      // Clear canvas with page background color
      ctx.fillStyle = "#333333"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const now = Date.now()

      // Draw server (large glowing blue circle in center)
      const serverRadius = 30
      const serverGlow = Math.sin(Date.now() * 0.003) * 0.3 + 0.7
      // Handle server color effect from pulses
      let serverColor = {r: 64, g: 150, b: 255} // Default blue
      if (serverColorEffect.current.fadeTime > now) {
        const effectProgress =
          1 - (serverColorEffect.current.fadeTime - now) / 300
        const effectIntensity =
          serverColorEffect.current.intensity * (1 - effectProgress)

        // Parse pulse color (hex to rgb)
        let pulseColor = {r: 64, g: 150, b: 255}
        if (serverColorEffect.current.color === "#4ade80") {
          pulseColor = {r: 74, g: 222, b: 128} // Green
        } else if (serverColorEffect.current.color === "#fb923c") {
          pulseColor = {r: 251, g: 146, b: 60} // Orange
        }

        // Blend server color with pulse color
        serverColor = {
          r: Math.floor(
            serverColor.r * (1 - effectIntensity) +
              pulseColor.r * effectIntensity,
          ),
          g: Math.floor(
            serverColor.g * (1 - effectIntensity) +
              pulseColor.g * effectIntensity,
          ),
          b: Math.floor(
            serverColor.b * (1 - effectIntensity) +
              pulseColor.b * effectIntensity,
          ),
        }
      }

      // Server glow effect
      const serverGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        serverRadius * 2,
      )
      serverGradient.addColorStop(
        0,
        `rgba(${serverColor.r}, ${serverColor.g}, ${serverColor.b}, ${serverGlow})`,
      )
      serverGradient.addColorStop(
        0.5,
        `rgba(${serverColor.r}, ${serverColor.g}, ${serverColor.b}, ${serverGlow * 0.3})`,
      )
      serverGradient.addColorStop(
        1,
        `rgba(${serverColor.r}, ${serverColor.g}, ${serverColor.b}, 0)`,
      )

      ctx.fillStyle = serverGradient
      ctx.fillRect(
        centerX - serverRadius * 2,
        centerY - serverRadius * 2,
        serverRadius * 4,
        serverRadius * 4,
      )

      // Server core
      ctx.beginPath()
      ctx.arc(centerX, centerY, serverRadius, 0, Math.PI * 2)
      ctx.fillStyle = `rgb(${serverColor.r}, ${serverColor.g}, ${serverColor.b})`
      ctx.fill()

      // Server label
      ctx.fillStyle = "#ffffff"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Server", centerX, centerY + 5)

      // Helper function to get client position
      const getClientPosition = (clientID, index, totalClients) => {
        const angle = (index / totalClients) * Math.PI * 2 // Fixed positions, no rotation
        const distance = 120
        return {
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
        }
      }

      // Draw clients (smaller blue circles around the server)
      const clients = Object.keys(clientData)
      const activeClients = clients.filter(id => now - clientData[id] < 20000)

      activeClients.forEach((clientID, index) => {
        const pos = getClientPosition(clientID, index, activeClients.length)

        const clientRadius = 15
        const isOwnClient = clientID === myClientID.current
        const clientAlpha = isOwnClient ? 1 : 0.8

        // Client glow effect
        const clientGlow = Math.sin(Date.now() * 0.005 + index) * 0.2 + 0.6
        const clientGradient = ctx.createRadialGradient(
          pos.x,
          pos.y,
          0,
          pos.x,
          pos.y,
          clientRadius * 1.5,
        )
        clientGradient.addColorStop(
          0,
          `rgba(100, 180, 255, ${clientGlow * clientAlpha})`,
        )
        clientGradient.addColorStop(
          0.7,
          `rgba(100, 180, 255, ${clientGlow * clientAlpha * 0.3})`,
        )
        clientGradient.addColorStop(1, "rgba(100, 180, 255, 0)")

        ctx.fillStyle = clientGradient
        ctx.fillRect(
          pos.x - clientRadius * 1.5,
          pos.y - clientRadius * 1.5,
          clientRadius * 3,
          clientRadius * 3,
        )

        // Client core
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, clientRadius, 0, Math.PI * 2)
        ctx.fillStyle = isOwnClient ? "#64b4ff" : "#80c4ff"
        ctx.fill()

        // Draw connection line to server
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(pos.x, pos.y)
        ctx.strokeStyle = `rgba(100, 180, 255, ${0.3 * clientAlpha})`
        ctx.lineWidth = 2
        ctx.stroke()

        // Client label
        ctx.fillStyle = isOwnClient ? "#ffffff" : "#e0e0e0"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.fillText(isOwnClient ? "You" : "Client", pos.x, pos.y + 3)
      })

      // Draw pulses
      pulses.current = pulses.current.filter(pulse => {
        const elapsed = now - pulse.startTime
        const progress = Math.min(elapsed / pulse.duration, 1)

        if (progress >= 1) return false // Remove completed pulses

        // Handle server as source
        let fromClientPos
        if (pulse.fromClientId === "server") {
          fromClientPos = {x: centerX, y: centerY}
        } else {
          // Find from client position
          const fromClientIndex = activeClients.indexOf(pulse.fromClientId)
          if (fromClientIndex === -1) return false // From client no longer active

          fromClientPos = getClientPosition(
            pulse.fromClientId,
            fromClientIndex,
            activeClients.length,
          )
        }

        // Calculate pulse start and end positions
        let startX, startY, endX, endY
        let stageProgress

        const toClientIndex = activeClients.indexOf(pulse.toClientId)
        if (pulse.toClientId !== "server" && toClientIndex === -1) return false // To client no longer active

        const toClientPos =
          pulse.toClientId === "server"
            ? {x: centerX, y: centerY}
            : getClientPosition(
                pulse.toClientId,
                toClientIndex,
                activeClients.length,
              )

        if (pulse.fromClientId === "server") {
          // Server-originated pulses are direct journeys (server -> destination)
          stageProgress = progress
          startX = centerX
          startY = centerY
          endX = toClientPos.x
          endY = toClientPos.y
        } else {
          // Client-originated pulses are two-stage journeys: source -> server -> destination
          if (progress <= 0.5) {
            // Stage 1: from source to server
            stageProgress = progress * 2 // 0 to 1 for first half
            startX = fromClientPos.x
            startY = fromClientPos.y
            endX = centerX
            endY = centerY
          } else {
            // Stage 2: from server to destination
            stageProgress = (progress - 0.5) * 2 // 0 to 1 for second half
            startX = centerX
            startY = centerY
            endX = toClientPos.x
            endY = toClientPos.y
          }
        }

        // Use stage progress for position calculation
        const effectiveProgress = stageProgress
        const currentX = startX + (endX - startX) * effectiveProgress
        const currentY = startY + (endY - startY) * effectiveProgress

        // Check distance from server for effects
        const serverRadius = 30
        const distanceFromServer = Math.sqrt(
          (currentX - centerX) ** 2 + (currentY - centerY) ** 2,
        )
        const isInsideServer = distanceFromServer < serverRadius
        const fadeZone = serverRadius + 15 // Fade starts 15px before server edge

        // Trigger server color effect when pulse reaches server
        if (distanceFromServer <= serverRadius + 5 && !pulse.triggeredEffect) {
          pulse.triggeredEffect = true
          serverColorEffect.current = {
            color: pulse.color,
            intensity: 0.4,
            fadeTime: now + 300, // Effect lasts 300ms
          }
        }

        // Calculate fade-out as pulse approaches server
        let fadeMultiplier = 1
        if (distanceFromServer < fadeZone && !isInsideServer) {
          fadeMultiplier = distanceFromServer / fadeZone
        } else if (isInsideServer) {
          fadeMultiplier = 0 // Completely hidden inside server
        }

        // Only draw pulse if visible
        if (fadeMultiplier > 0) {
          // Draw pulse
          const pulseRadius = 8
          const basePulseAlpha = Math.sin(progress * Math.PI) // Base fade in and out
          const pulseAlpha = basePulseAlpha * fadeMultiplier

          ctx.beginPath()
          ctx.arc(currentX, currentY, pulseRadius, 0, Math.PI * 2)
          ctx.fillStyle =
            pulse.color +
            Math.floor(pulseAlpha * 255)
              .toString(16)
              .padStart(2, "0")
          ctx.fill()

          // Pulse glow
          const pulseGradient = ctx.createRadialGradient(
            currentX,
            currentY,
            0,
            currentX,
            currentY,
            pulseRadius * 2,
          )
          pulseGradient.addColorStop(
            0,
            pulse.color +
              Math.floor(pulseAlpha * 128)
                .toString(16)
                .padStart(2, "0"),
          )
          pulseGradient.addColorStop(1, pulse.color + "00")
          ctx.fillStyle = pulseGradient
          ctx.beginPath()
          ctx.arc(currentX, currentY, pulseRadius * 2, 0, Math.PI * 2)
          ctx.fill()
        }

        return true // Keep pulse
      })

      // Connection count
      ctx.fillStyle = "#ffffff"
      ctx.font = "14px Arial"
      ctx.textAlign = "left"
      ctx.fillText(
        `Connected: ${activeClients.length} client${activeClients.length !== 1 ? "s" : ""}`,
        10,
        25,
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [clientData])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      style={{
        borderRadius: "8px",
        backgroundColor: "#333333",
        display: "block",
        margin: "0 auto",
      }}
    />
  )
}

export default HolsterVisualization
