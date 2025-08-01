import Holster from "@mblaney/holster/src/holster.js"
import Container from "@mui/material/Container"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import {Logo} from "./logo.js"

// If on localhost assume Holster is directly available and use the default
// settings, otherwise assume a secure connection is required.
let peers
if (window.location.hostname !== "localhost") {
  peers = ["wss://" + window.location.hostname]
}

const holster = Holster({peers: peers})
// This provides access to the API via the console.
window.holster = holster

const App = () => {
  return (
    <Container maxWidth="md">
      <Grid container>
        <Grid item xs={12} size="grow">
          <Logo />
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Typography sx={{pt: 10}}>
          Holster is a service for synchronising data between devices using
          Node, Deno, Bun or the browser. Check out the{" "}
          <Link href="https://github.com/mblaney/holster/wiki">
            API documentation on GitHub
          </Link>
          .
        </Typography>
        <Typography sx={{pt: 2}}>
          Holster requires a server for browsers to connect to. If you would
          like to try using Holster without setting up a server, you can use
          this site with:
          <br />
          <code>const holster = Holster("wss://holster.haza.website")</code>
        </Typography>
        <Typography sx={{pt: 2}}>
          This server should only be used for testing, and only stores data for
          a day. To test, try syncing data between browsers by opening this site
          on different devices! The console is available below as "cons" and the
          full API is available to create data and user accounts.
        </Typography>
        <Typography sx={{pt: 2, pb: 4}}>
          What commands can you run? Try putting data with:
          <br />
          <code>holster.get("hello").put("world", cons.log)</code>
          <br />
          <br />
          Or create a user with (returns null on success):
          <br />
          <code>holster.user().create("username", "password", cons.log)</code>
          <br />
          <br />
          All public data is written to a root node in the graph, so you can
          also see what others have added using the wire spec:
          <br />
          <code>holster.wire.get(&#123;"#": "root"&#125;, cons.log)</code>
        </Typography>
        <Divider sx={{borderColor: "#ffffff"}} />
      </Grid>
    </Container>
  )
}

export default App
