import express from "express"
import path from "path"
import {fileURLToPath} from "url"
import Holster from "@mblaney/holster/src/holster.js"

const dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(express.static(path.join(dirname, "../browser/build")))
app.listen(3000)

app.get("/", (req, res) => {
  res.sendFile(path.join(dirname, "../browser/build", "index.html"))
})

// These redirects are required because the browser does local first routing,
// which is fine except for an initial request or hard refresh, in which case
// the server needs to respond to the request.
app.get("/playground", (req, res) => {
  res.redirect("/?redirect=playground")
})

Holster()
