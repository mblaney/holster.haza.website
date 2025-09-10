import {useEffect} from "react"
import Container from "@mui/material/Container"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import {Logo} from "./logo.js"

const Playground = () => {
  useEffect(() => {
    sessionStorage.setItem("showConsole", "true")
    return () => {
      sessionStorage.removeItem("showConsole")
    }
  }, [])

  return (
    <Container maxWidth="md">
      <Grid container>
        <Grid item xs={12} size="grow">
          <Link href="/" sx={{textDecoration: "none"}}>
            <Logo />
          </Link>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h4" sx={{pt: 4, pb: 2}}>
            Playground
          </Typography>
          <Typography sx={{pt: 2}}>
            Holster requires a server for browsers to connect to. If you would
            like to try using Holster without setting up a server, you can use
            this site with:
            <br />
            <code>const holster = Holster("wss://holster.haza.website")</code>
          </Typography>
          <Typography sx={{pt: 2}}>
            This server should only be used for testing, and only stores data
            for a day. The console is available below as <b>cons</b> and the
            full API is available to create data and user accounts.
          </Typography>
          <Typography sx={{pt: 2}}>
            What commands can you run? Try putting data with:
            <br />
            <code>holster.get("hello").put("world", cons.log)</code>
            <br />
            <br />
            Or create a user with:
            <br />
            <code>holster.user().create("username", "password", cons.log)</code>
          </Typography>
          <Typography sx={{pt: 2, pb: 4}}>
            These commands return <b>null</b> on success, which you should see
            in the console output. Try fetching data with:
            <br />
            <code>holster.get("hello", cons.log)</code>
            <br />
            <br />
            Listen from another device or window while putting data to see the
            browsers sync in real time:
            <br />
            <code>holster.get("hello").on(cons.log)</code>
          </Typography>
          <Divider sx={{borderColor: "#ffffff"}} />
        </Grid>
      </Grid>
    </Container>
  )
}

export default Playground
