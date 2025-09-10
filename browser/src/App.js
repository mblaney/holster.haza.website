import {useEffect} from "react"
import Holster from "@mblaney/holster/src/holster.js"
import {
  BrowserRouter,
  Routes,
  Route,
  Link as RouterLink,
  Navigate,
} from "react-router-dom"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import {Logo} from "./logo.js"
import Playground from "./Playground.js"
import HolsterVisualization from "./HolsterVisualization.js"

// If on localhost assume Holster is directly available and use the default
// settings, otherwise assume a secure connection is required.
let peers
if (window.location.hostname !== "localhost") {
  peers = ["wss://" + window.location.hostname]
}

const holster = Holster({peers: peers, indexedDB: true})
// This provides access to the API via the console.
window.holster = holster

const params = new URLSearchParams(window.location.search)
const pages = ["playground"]
const redirect = params.get("redirect")
const to = redirect ? (pages.includes(redirect) ? `/${redirect}` : "/") : ""

const Home = () => {
  useEffect(() => {
    sessionStorage.removeItem("showConsole")
  }, [])

  return (
    <Container maxWidth="md">
      <Grid container>
        <Grid item xs={12} size="grow">
          <Logo />
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Typography sx={{pt: 2}}>
          Holster is a real-time data synchronisation service that seamlessly
          connects devices using Node.js, Deno, Bun or the browser. Built with
          modern ES modules, it features end-to-end encryption, intelligent
          conflict resolution, and cross-platform compatibility.
        </Typography>
        <Typography
          sx={{
            p: 2,
            m: 2,
            backgroundColor: "#444444",
            borderTopRightRadius: 10,
            borderBottomLeftRadius: 10,
          }}
        >
          ✨ <strong>Real-time sync</strong> across all connected devices
          <br />
          🔐 <strong>Built-in encryption</strong> with user authentication
          <br />⚡ <strong>Zero configuration</strong> with smart performance
          optimisation
          <br />
          🌐 <strong>Universal compatibility</strong> - works everywhere
          JavaScript runs
        </Typography>
        <Typography sx={{pt: 2, fontStyle: "italic"}}>
          🚀 Holster is running live in your browser right now, automatically
          synchronising with other clients connected to this server! Open
          multiple browser windows to see it in action.
        </Typography>
        <div style={{margin: "24px 0"}}>
          <HolsterVisualization />
        </div>
        <Typography sx={{pb: 2}}>
          📘 Check out the{" "}
          <Link href="https://github.com/mblaney/holster/wiki">
            API documentation on GitHub
          </Link>{" "}
          and{" "}
          <Link component={RouterLink} to="/playground">
            try it out in the playground!
          </Link>
        </Typography>
      </Grid>
    </Container>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/playground" element={<Playground />} />
        <Route path="/" element={to ? <Navigate to={to} /> : <Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
